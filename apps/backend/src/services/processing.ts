/**
 * Photo Processing Service
 * 
 * Handles face detection, clothing analysis, text detection,
 * and clustering for uploaded photos.
 */

import type { VisionProvider, PhotoDetectionResult } from '../vision';
import type { StorageService } from '../storage/types';
import type { Photo, PersonCluster, FaceDetection } from '../models';
import { cosineSimilarity } from '../vision';

/** Clustering configuration */
export interface ClusteringConfig {
  /** Similarity threshold for same person (0-1) */
  similarityThreshold: number;
  /** Minimum confidence for face detection */
  minFaceConfidence: number;
  /** Minimum confidence for bib detection */
  minBibConfidence: number;
}

const DEFAULT_CONFIG: ClusteringConfig = {
  similarityThreshold: 0.7,
  minFaceConfidence: 0.8,
  minBibConfidence: 0.7,
};

/**
 * Process a photo: detect faces, clothing, text, and update clusters.
 */
export async function processPhoto(
  photo: Photo,
  imageBytes: ArrayBuffer,
  visionProvider: VisionProvider,
  storage: StorageService,
  config: Partial<ClusteringConfig> = {}
): Promise<{ success: boolean; error?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Mark as processing
    await storage.updatePhotoStatus(photo.id, 'processing');
    
    // Run vision analysis
    const result = await visionProvider.analyzePhoto(imageBytes, photo.id);
    
    if (!result.success) {
      await storage.updatePhotoStatus(photo.id, 'failed', result.error.message);
      return { success: false, error: result.error.message };
    }
    
    const detections = result.data;
    
    // Get existing embeddings for clustering
    const existingEmbeddings = await storage.getEventEmbeddings(photo.eventId);
    
    // Process each detected face
    for (const face of detections.faces) {
      if (face.confidence < cfg.minFaceConfidence) continue;
      
      // Save face detection
      const savedFace = await storage.createFaceDetection({
        photoId: photo.id,
        boundingBox: face.boundingBox,
        confidence: face.confidence,
        embedding: face.embedding,
      });
      
      // Find best matching cluster
      const { clusterId, similarity } = findBestCluster(
        face.embedding,
        existingEmbeddings,
        cfg.similarityThreshold
      );
      
      if (clusterId) {
        // Assign to existing cluster
        await storage.updateFaceCluster(savedFace.id, clusterId, similarity);
        
        // Update cluster counts
        const cluster = await storage.getCluster(clusterId);
        if (cluster) {
          await storage.updateCluster(clusterId, {
            faceCount: cluster.faceCount + 1,
            photoCount: cluster.photoCount + 1,
          });
        }
      } else {
        // Create new cluster
        const newCluster = await storage.createCluster({
          eventId: photo.eventId,
          representativeFaceId: savedFace.id,
          representativePhotoId: photo.id,
          representativeThumbnailUrl: photo.thumbnailUrl,
        });
        
        await storage.updateFaceCluster(savedFace.id, newCluster.id, 1.0);
        await storage.updateCluster(newCluster.id, {
          faceCount: 1,
          photoCount: 1,
        });
        
        // Add to existing embeddings for subsequent faces
        existingEmbeddings.push({
          faceId: savedFace.id,
          clusterId: newCluster.id,
          embedding: face.embedding,
        });
      }
    }
    
    // Process clothing attributes
    for (const person of detections.persons) {
      await storage.createClothingAttributes({
        photoId: photo.id,
        faceDetectionId: person.faceDetectionId,
        dominantColors: person.dominantColors,
        items: person.clothingItems.map(item => ({
          type: item.type,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          confidence: item.confidence,
        })),
        descriptors: person.descriptors,
        confidence: person.confidence,
      });
      
      // Add clothing tags to cluster if linked
      if (person.faceDetectionId) {
        const faces = await storage.getFaceDetectionsByPhoto(photo.id);
        const linkedFace = faces.find(f => f.id === person.faceDetectionId);
        if (linkedFace?.clusterId) {
          const cluster = await storage.getCluster(linkedFace.clusterId);
          if (cluster) {
            const newTags = [...cluster.tags];
            for (const desc of person.descriptors) {
              if (!newTags.includes(desc)) {
                newTags.push(desc);
              }
            }
            await storage.updateCluster(linkedFace.clusterId, { tags: newTags });
          }
        }
      }
    }
    
    // Process bib detections
    for (const text of detections.textDetections) {
      if (text.type !== 'bib-number' && text.type !== 'jersey-number') continue;
      if (text.confidence < cfg.minBibConfidence) continue;
      
      await storage.createBibDetection({
        photoId: photo.id,
        faceDetectionId: text.associatedPersonId,
        bibNumber: text.text,
        boundingBox: text.boundingBox,
        confidence: text.confidence,
      });
      
      // Add bib tag to cluster if linked
      if (text.associatedPersonId) {
        const faces = await storage.getFaceDetectionsByPhoto(photo.id);
        const linkedFace = faces.find(f => f.id === text.associatedPersonId);
        if (linkedFace?.clusterId) {
          const cluster = await storage.getCluster(linkedFace.clusterId);
          if (cluster) {
            const bibTag = `bib:${text.text}`;
            if (!cluster.tags.includes(bibTag)) {
              await storage.updateCluster(linkedFace.clusterId, {
                tags: [...cluster.tags, bibTag],
              });
            }
          }
        }
      }
    }
    
    // Mark as processed
    await storage.updatePhotoStatus(photo.id, 'processed');
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await storage.updatePhotoStatus(photo.id, 'failed', message);
    return { success: false, error: message };
  }
}

/**
 * Find the best matching cluster for a face embedding.
 */
function findBestCluster(
  embedding: number[],
  existingEmbeddings: { faceId: string; clusterId: string | null; embedding: number[] }[],
  threshold: number
): { clusterId: string | null; similarity: number } {
  let bestClusterId: string | null = null;
  let bestSimilarity = 0;
  
  // Group embeddings by cluster
  const clusterEmbeddings: Map<string, number[][]> = new Map();
  
  for (const e of existingEmbeddings) {
    if (!e.clusterId) continue;
    
    let embeddings = clusterEmbeddings.get(e.clusterId);
    if (!embeddings) {
      embeddings = [];
      clusterEmbeddings.set(e.clusterId, embeddings);
    }
    embeddings.push(e.embedding);
  }
  
  // Compare against cluster centroids (average embedding)
  for (const [clusterId, embeddings] of clusterEmbeddings) {
    // Calculate average similarity to all faces in cluster
    let totalSim = 0;
    for (const e of embeddings) {
      totalSim += cosineSimilarity(embedding, e);
    }
    const avgSim = totalSim / embeddings.length;
    
    if (avgSim > bestSimilarity && avgSim >= threshold) {
      bestSimilarity = avgSim;
      bestClusterId = clusterId;
    }
  }
  
  return { clusterId: bestClusterId, similarity: bestSimilarity };
}

/**
 * Re-cluster all faces in an event.
 * Useful after parameter changes or to improve clustering.
 */
export async function reclusterEvent(
  eventId: string,
  storage: StorageService,
  config: Partial<ClusteringConfig> = {}
): Promise<{ clusterCount: number }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Get all embeddings
  const embeddings = await storage.getEventEmbeddings(eventId);
  
  // Clear existing cluster assignments
  const existingClusters = await storage.getClustersByEvent(eventId);
  for (const cluster of existingClusters) {
    await storage.deleteCluster(cluster.id);
  }
  
  // Simple greedy clustering
  const newClusters: { id: string; embeddings: number[][] }[] = [];
  
  for (const { faceId, embedding } of embeddings) {
    let assigned = false;
    
    // Try to assign to existing cluster
    for (const cluster of newClusters) {
      // Calculate average similarity
      let totalSim = 0;
      for (const e of cluster.embeddings) {
        totalSim += cosineSimilarity(embedding, e);
      }
      const avgSim = totalSim / cluster.embeddings.length;
      
      if (avgSim >= cfg.similarityThreshold) {
        await storage.updateFaceCluster(faceId, cluster.id, avgSim);
        cluster.embeddings.push(embedding);
        assigned = true;
        break;
      }
    }
    
    // Create new cluster if not assigned
    if (!assigned) {
      const face = await storage.getFaceDetection(faceId);
      if (face) {
        const photo = await storage.getPhoto(face.photoId);
        const newCluster = await storage.createCluster({
          eventId,
          representativeFaceId: faceId,
          representativePhotoId: face.photoId,
          representativeThumbnailUrl: photo?.thumbnailUrl,
        });
        
        await storage.updateFaceCluster(faceId, newCluster.id, 1.0);
        newClusters.push({ id: newCluster.id, embeddings: [embedding] });
      }
    }
  }
  
  // Update cluster counts
  for (const cluster of newClusters) {
    const faces = await storage.getFaceDetectionsByCluster(cluster.id);
    const photoIds = new Set(faces.map(f => f.photoId));
    
    await storage.updateCluster(cluster.id, {
      faceCount: faces.length,
      photoCount: photoIds.size,
    });
  }
  
  return { clusterCount: newClusters.length };
}
