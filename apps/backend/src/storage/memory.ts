/**
 * In-Memory Storage Implementation
 * 
 * Simple in-memory storage for development and testing.
 * Data is lost on worker restart - not for production use.
 * 
 * This provides a reference implementation that can be replaced
 * with D1, KV, or other persistent storage backends.
 */

import type { StorageService } from './types';
import type {
  Event,
  Photo,
  PhotoInput,
  FaceDetection,
  FaceDetectionInput,
  PersonCluster,
  PersonClusterInput,
  ClothingAttributes,
  ClothingAttributesInput,
  BibDetection,
  BibDetectionInput,
  MatchFeedback,
  ProcessingStatus,
  ClothingSearchFilters,
  ClusterSearchResult,
} from '../models';
import { cosineSimilarity } from '../vision';

/** Generate a unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Get current ISO timestamp */
function now(): string {
  return new Date().toISOString();
}

/**
 * In-Memory Storage Implementation
 */
export class InMemoryStorage implements StorageService {
  // Data stores
  private events: Map<string, Event> = new Map();
  private photos: Map<string, Photo> = new Map();
  private faceDetections: Map<string, FaceDetection> = new Map();
  private clusters: Map<string, PersonCluster> = new Map();
  private clothingAttrs: Map<string, ClothingAttributes> = new Map();
  private bibDetections: Map<string, BibDetection> = new Map();
  private matchFeedback: Map<string, MatchFeedback> = new Map();
  
  // Indexes for fast lookups
  private photosByEvent: Map<string, Set<string>> = new Map();
  private facesByPhoto: Map<string, Set<string>> = new Map();
  private facesByCluster: Map<string, Set<string>> = new Map();
  private clustersByEvent: Map<string, Set<string>> = new Map();
  private bibsByPhoto: Map<string, Set<string>> = new Map();
  private clothingByPhoto: Map<string, Set<string>> = new Map();
  
  // ============================================
  // Event Operations
  // ============================================
  
  async getEvent(eventId: string): Promise<Event | null> {
    return this.events.get(eventId) ?? null;
  }
  
  async listEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async createEvent(event: Omit<Event, 'createdAt' | 'updatedAt'>): Promise<Event> {
    const timestamp = now();
    const newEvent: Event = {
      ...event,
      id: event.id || generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      photoCount: 0,
      clusterCount: 0,
    };
    this.events.set(newEvent.id, newEvent);
    this.photosByEvent.set(newEvent.id, new Set());
    this.clustersByEvent.set(newEvent.id, new Set());
    return newEvent;
  }
  
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    const event = this.events.get(eventId);
    if (!event) return null;
    
    const updated: Event = {
      ...event,
      ...updates,
      id: eventId, // Prevent ID change
      updatedAt: now(),
    };
    this.events.set(eventId, updated);
    return updated;
  }
  
  async deleteEvent(eventId: string): Promise<boolean> {
    const existed = this.events.delete(eventId);
    this.photosByEvent.delete(eventId);
    this.clustersByEvent.delete(eventId);
    return existed;
  }
  
  // ============================================
  // Photo Operations
  // ============================================
  
  async getPhoto(photoId: string): Promise<Photo | null> {
    return this.photos.get(photoId) ?? null;
  }
  
  async getPhotosByEvent(eventId: string): Promise<Photo[]> {
    const photoIds = this.photosByEvent.get(eventId);
    if (!photoIds) return [];
    
    const photos: Photo[] = [];
    for (const id of photoIds) {
      const photo = this.photos.get(id);
      if (photo) photos.push(photo);
    }
    return photos;
  }
  
  async createPhoto(input: PhotoInput): Promise<Photo> {
    const id = generateId();
    const photo: Photo = {
      ...input,
      id,
      uploadedAt: now(),
      processingStatus: 'pending',
    };
    
    this.photos.set(id, photo);
    
    // Update indexes
    let eventPhotos = this.photosByEvent.get(input.eventId);
    if (!eventPhotos) {
      eventPhotos = new Set();
      this.photosByEvent.set(input.eventId, eventPhotos);
    }
    eventPhotos.add(id);
    
    // Update event photo count
    const event = this.events.get(input.eventId);
    if (event) {
      this.events.set(input.eventId, {
        ...event,
        photoCount: (event.photoCount ?? 0) + 1,
        updatedAt: now(),
      });
    }
    
    return photo;
  }
  
  async updatePhotoStatus(
    photoId: string,
    status: ProcessingStatus,
    error?: string
  ): Promise<Photo | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;
    
    const updated: Photo = {
      ...photo,
      processingStatus: status,
      processingError: error,
      processedAt: status === 'processed' ? now() : undefined,
    };
    this.photos.set(photoId, updated);
    return updated;
  }
  
  async deletePhoto(photoId: string): Promise<boolean> {
    const photo = this.photos.get(photoId);
    if (!photo) return false;
    
    // Remove from indexes
    const eventPhotos = this.photosByEvent.get(photo.eventId);
    if (eventPhotos) {
      eventPhotos.delete(photoId);
    }
    
    // Update event photo count
    const event = this.events.get(photo.eventId);
    if (event) {
      this.events.set(photo.eventId, {
        ...event,
        photoCount: Math.max(0, (event.photoCount ?? 0) - 1),
        updatedAt: now(),
      });
    }
    
    return this.photos.delete(photoId);
  }
  
  // ============================================
  // Face Detection Operations
  // ============================================
  
  async getFaceDetection(faceId: string): Promise<FaceDetection | null> {
    return this.faceDetections.get(faceId) ?? null;
  }
  
  async getFaceDetectionsByPhoto(photoId: string): Promise<FaceDetection[]> {
    const faceIds = this.facesByPhoto.get(photoId);
    if (!faceIds) return [];
    
    const faces: FaceDetection[] = [];
    for (const id of faceIds) {
      const face = this.faceDetections.get(id);
      if (face) faces.push(face);
    }
    return faces;
  }
  
  async getFaceDetectionsByCluster(clusterId: string): Promise<FaceDetection[]> {
    const faceIds = this.facesByCluster.get(clusterId);
    if (!faceIds) return [];
    
    const faces: FaceDetection[] = [];
    for (const id of faceIds) {
      const face = this.faceDetections.get(id);
      if (face) faces.push(face);
    }
    return faces;
  }
  
  async createFaceDetection(input: FaceDetectionInput): Promise<FaceDetection> {
    const id = generateId();
    const face: FaceDetection = {
      id,
      photoId: input.photoId,
      boundingBox: input.boundingBox,
      confidence: input.confidence,
      embedding: JSON.stringify(input.embedding),
      createdAt: now(),
    };
    
    this.faceDetections.set(id, face);
    
    // Update indexes
    let photoFaces = this.facesByPhoto.get(input.photoId);
    if (!photoFaces) {
      photoFaces = new Set();
      this.facesByPhoto.set(input.photoId, photoFaces);
    }
    photoFaces.add(id);
    
    return face;
  }
  
  async updateFaceCluster(
    faceId: string,
    clusterId: string,
    confidence: number
  ): Promise<FaceDetection | null> {
    const face = this.faceDetections.get(faceId);
    if (!face) return null;
    
    // Remove from old cluster index
    if (face.clusterId) {
      const oldClusterFaces = this.facesByCluster.get(face.clusterId);
      if (oldClusterFaces) {
        oldClusterFaces.delete(faceId);
      }
    }
    
    // Update face
    const updated: FaceDetection = {
      ...face,
      clusterId,
      clusterConfidence: confidence,
    };
    this.faceDetections.set(faceId, updated);
    
    // Add to new cluster index
    let clusterFaces = this.facesByCluster.get(clusterId);
    if (!clusterFaces) {
      clusterFaces = new Set();
      this.facesByCluster.set(clusterId, clusterFaces);
    }
    clusterFaces.add(faceId);
    
    return updated;
  }
  
  // ============================================
  // Person Cluster Operations
  // ============================================
  
  async getCluster(clusterId: string): Promise<PersonCluster | null> {
    return this.clusters.get(clusterId) ?? null;
  }
  
  async getClustersByEvent(eventId: string): Promise<PersonCluster[]> {
    const clusterIds = this.clustersByEvent.get(eventId);
    if (!clusterIds) return [];
    
    const clusters: PersonCluster[] = [];
    for (const id of clusterIds) {
      const cluster = this.clusters.get(id);
      if (cluster) clusters.push(cluster);
    }
    return clusters;
  }
  
  async createCluster(input: PersonClusterInput): Promise<PersonCluster> {
    const id = generateId();
    const timestamp = now();
    const cluster: PersonCluster = {
      id,
      eventId: input.eventId,
      representativeFaceId: input.representativeFaceId,
      representativePhotoId: input.representativePhotoId,
      representativeThumbnailUrl: input.representativeThumbnailUrl,
      tags: input.tags ?? [],
      faceCount: 0,
      photoCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    this.clusters.set(id, cluster);
    
    // Update indexes
    let eventClusters = this.clustersByEvent.get(input.eventId);
    if (!eventClusters) {
      eventClusters = new Set();
      this.clustersByEvent.set(input.eventId, eventClusters);
    }
    eventClusters.add(id);
    
    // Update event cluster count
    const event = this.events.get(input.eventId);
    if (event) {
      this.events.set(input.eventId, {
        ...event,
        clusterCount: (event.clusterCount ?? 0) + 1,
        updatedAt: now(),
      });
    }
    
    return cluster;
  }
  
  async updateCluster(
    clusterId: string,
    updates: Partial<PersonCluster>
  ): Promise<PersonCluster | null> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return null;
    
    const updated: PersonCluster = {
      ...cluster,
      ...updates,
      id: clusterId, // Prevent ID change
      eventId: cluster.eventId, // Prevent event change
      updatedAt: now(),
    };
    this.clusters.set(clusterId, updated);
    return updated;
  }
  
  async deleteCluster(clusterId: string): Promise<boolean> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return false;
    
    // Remove from indexes
    const eventClusters = this.clustersByEvent.get(cluster.eventId);
    if (eventClusters) {
      eventClusters.delete(clusterId);
    }
    this.facesByCluster.delete(clusterId);
    
    // Update event cluster count
    const event = this.events.get(cluster.eventId);
    if (event) {
      this.events.set(cluster.eventId, {
        ...event,
        clusterCount: Math.max(0, (event.clusterCount ?? 0) - 1),
        updatedAt: now(),
      });
    }
    
    return this.clusters.delete(clusterId);
  }
  
  async getEventEmbeddings(eventId: string): Promise<{
    faceId: string;
    clusterId: string | null;
    embedding: number[];
  }[]> {
    const photoIds = this.photosByEvent.get(eventId);
    if (!photoIds) return [];
    
    const results: { faceId: string; clusterId: string | null; embedding: number[] }[] = [];
    
    for (const photoId of photoIds) {
      const faceIds = this.facesByPhoto.get(photoId);
      if (!faceIds) continue;
      
      for (const faceId of faceIds) {
        const face = this.faceDetections.get(faceId);
        if (!face) continue;
        
        try {
          const embedding = JSON.parse(face.embedding) as number[];
          results.push({
            faceId: face.id,
            clusterId: face.clusterId ?? null,
            embedding,
          });
        } catch {
          // Skip faces with invalid embeddings
        }
      }
    }
    
    return results;
  }
  
  // ============================================
  // Clothing Attributes Operations
  // ============================================
  
  async getClothingByPhoto(photoId: string): Promise<ClothingAttributes[]> {
    const attrIds = this.clothingByPhoto.get(photoId);
    if (!attrIds) return [];
    
    const attrs: ClothingAttributes[] = [];
    for (const id of attrIds) {
      const attr = this.clothingAttrs.get(id);
      if (attr) attrs.push(attr);
    }
    return attrs;
  }
  
  async createClothingAttributes(input: ClothingAttributesInput): Promise<ClothingAttributes> {
    const id = generateId();
    const attrs: ClothingAttributes = {
      id,
      photoId: input.photoId,
      faceDetectionId: input.faceDetectionId,
      dominantColors: input.dominantColors,
      items: input.items,
      descriptors: input.descriptors,
      confidence: input.confidence,
      createdAt: now(),
    };
    
    this.clothingAttrs.set(id, attrs);
    
    // Update indexes
    let photoClothing = this.clothingByPhoto.get(input.photoId);
    if (!photoClothing) {
      photoClothing = new Set();
      this.clothingByPhoto.set(input.photoId, photoClothing);
    }
    photoClothing.add(id);
    
    return attrs;
  }
  
  // ============================================
  // Bib Detection Operations
  // ============================================
  
  async getBibsByPhoto(photoId: string): Promise<BibDetection[]> {
    const bibIds = this.bibsByPhoto.get(photoId);
    if (!bibIds) return [];
    
    const bibs: BibDetection[] = [];
    for (const id of bibIds) {
      const bib = this.bibDetections.get(id);
      if (bib) bibs.push(bib);
    }
    return bibs;
  }
  
  async createBibDetection(input: BibDetectionInput): Promise<BibDetection> {
    const id = generateId();
    const bib: BibDetection = {
      id,
      photoId: input.photoId,
      faceDetectionId: input.faceDetectionId,
      bibNumber: input.bibNumber,
      boundingBox: input.boundingBox,
      confidence: input.confidence,
      createdAt: now(),
    };
    
    this.bibDetections.set(id, bib);
    
    // Update indexes
    let photoBibs = this.bibsByPhoto.get(input.photoId);
    if (!photoBibs) {
      photoBibs = new Set();
      this.bibsByPhoto.set(input.photoId, photoBibs);
    }
    photoBibs.add(id);
    
    return bib;
  }
  
  // ============================================
  // Match Feedback Operations
  // ============================================
  
  async createMatchFeedback(
    clusterId: string,
    photoId: string,
    isMatch: boolean,
    userId?: string
  ): Promise<MatchFeedback> {
    const id = generateId();
    const feedback: MatchFeedback = {
      id,
      clusterId,
      photoId,
      isMatch,
      userId,
      createdAt: now(),
    };
    
    this.matchFeedback.set(id, feedback);
    return feedback;
  }
  
  async getFeedbackByCluster(clusterId: string): Promise<MatchFeedback[]> {
    const results: MatchFeedback[] = [];
    for (const feedback of this.matchFeedback.values()) {
      if (feedback.clusterId === clusterId) {
        results.push(feedback);
      }
    }
    return results;
  }
  
  // ============================================
  // Search Operations
  // ============================================
  
  async searchByBib(
    eventId: string,
    bibNumber: string
  ): Promise<ClusterSearchResult[]> {
    const results: ClusterSearchResult[] = [];
    const normalizedBib = bibNumber.toLowerCase().trim();
    
    // Get all photos for the event
    const photoIds = this.photosByEvent.get(eventId);
    if (!photoIds) return [];
    
    // Find photos with matching bib numbers
    const matchingPhotos: Map<string, { photoId: string; confidence: number }[]> = new Map();
    
    for (const photoId of photoIds) {
      const bibs = await this.getBibsByPhoto(photoId);
      for (const bib of bibs) {
        if (bib.bibNumber.toLowerCase().trim() === normalizedBib) {
          // Find the cluster for this photo's face
          const faces = await this.getFaceDetectionsByPhoto(photoId);
          for (const face of faces) {
            if (face.clusterId) {
              let photos = matchingPhotos.get(face.clusterId);
              if (!photos) {
                photos = [];
                matchingPhotos.set(face.clusterId, photos);
              }
              photos.push({ photoId, confidence: bib.confidence });
            }
          }
        }
      }
    }
    
    // Build results
    for (const [clusterId, photos] of matchingPhotos) {
      const cluster = await this.getCluster(clusterId);
      if (!cluster) continue;
      
      const clusterPhotos = await this.getClusterPhotos(clusterId);
      
      results.push({
        cluster,
        similarity: 1.0, // Exact bib match
        matchingPhotos: photos.map(p => {
          const photo = this.photos.get(p.photoId);
          return {
            photoId: p.photoId,
            thumbnailUrl: photo?.thumbnailUrl ?? '',
            confidence: p.confidence,
          };
        }),
        totalPhotoCount: clusterPhotos.total,
      });
    }
    
    return results;
  }
  
  async searchByClothing(
    eventId: string,
    filters: ClothingSearchFilters
  ): Promise<ClusterSearchResult[]> {
    const results: Map<string, ClusterSearchResult> = new Map();
    
    const photoIds = this.photosByEvent.get(eventId);
    if (!photoIds) return [];
    
    for (const photoId of photoIds) {
      const clothingList = await this.getClothingByPhoto(photoId);
      
      for (const clothing of clothingList) {
        let matches = true;
        let matchScore = 0;
        
        // Check primary color
        if (filters.primaryColor) {
          if (clothing.dominantColors.includes(filters.primaryColor)) {
            matchScore += 0.4;
          } else {
            matches = false;
          }
        }
        
        // Check secondary color
        if (matches && filters.secondaryColor) {
          if (clothing.dominantColors.includes(filters.secondaryColor)) {
            matchScore += 0.2;
          } else {
            matches = false;
          }
        }
        
        // Check descriptor
        if (matches && filters.descriptor) {
          const normalizedDesc = filters.descriptor.toLowerCase();
          const hasMatch = clothing.descriptors.some(d =>
            d.toLowerCase().includes(normalizedDesc)
          );
          if (hasMatch) {
            matchScore += 0.4;
          } else {
            matches = false;
          }
        }
        
        if (!matches) continue;
        
        // Find cluster for this detection
        if (clothing.faceDetectionId) {
          const face = await this.getFaceDetection(clothing.faceDetectionId);
          if (face?.clusterId) {
            const cluster = await this.getCluster(face.clusterId);
            if (cluster) {
              const existing = results.get(cluster.id);
              const photo = this.photos.get(photoId);
              
              if (existing) {
                existing.matchingPhotos.push({
                  photoId,
                  thumbnailUrl: photo?.thumbnailUrl ?? '',
                  confidence: matchScore,
                });
                existing.similarity = Math.max(existing.similarity, matchScore);
              } else {
                const clusterPhotos = await this.getClusterPhotos(cluster.id);
                results.set(cluster.id, {
                  cluster,
                  similarity: matchScore,
                  matchingPhotos: [{
                    photoId,
                    thumbnailUrl: photo?.thumbnailUrl ?? '',
                    confidence: matchScore,
                  }],
                  totalPhotoCount: clusterPhotos.total,
                });
              }
            }
          }
        }
      }
    }
    
    return Array.from(results.values())
      .sort((a, b) => b.similarity - a.similarity);
  }
  
  async searchByFaceEmbedding(
    eventId: string,
    queryEmbedding: number[],
    threshold: number
  ): Promise<ClusterSearchResult[]> {
    const embeddings = await this.getEventEmbeddings(eventId);
    const clusterScores: Map<string, { totalSim: number; count: number; faceIds: string[] }> = new Map();
    
    for (const { faceId, clusterId, embedding } of embeddings) {
      if (!clusterId) continue;
      
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      if (similarity < threshold) continue;
      
      const existing = clusterScores.get(clusterId);
      if (existing) {
        existing.totalSim += similarity;
        existing.count++;
        existing.faceIds.push(faceId);
      } else {
        clusterScores.set(clusterId, {
          totalSim: similarity,
          count: 1,
          faceIds: [faceId],
        });
      }
    }
    
    const results: ClusterSearchResult[] = [];
    
    for (const [clusterId, scores] of clusterScores) {
      const cluster = await this.getCluster(clusterId);
      if (!cluster) continue;
      
      const avgSimilarity = scores.totalSim / scores.count;
      const clusterPhotos = await this.getClusterPhotos(clusterId, 5);
      
      results.push({
        cluster,
        similarity: avgSimilarity,
        matchingPhotos: clusterPhotos.photos.map(p => ({
          photoId: p.id,
          thumbnailUrl: p.thumbnailUrl,
          confidence: avgSimilarity,
        })),
        totalPhotoCount: clusterPhotos.total,
      });
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }
  
  async getClusterPhotos(
    clusterId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ photos: Photo[]; total: number }> {
    const faceIds = this.facesByCluster.get(clusterId);
    if (!faceIds) return { photos: [], total: 0 };
    
    const photoIds = new Set<string>();
    for (const faceId of faceIds) {
      const face = this.faceDetections.get(faceId);
      if (face) {
        photoIds.add(face.photoId);
      }
    }
    
    const allPhotoIds = Array.from(photoIds);
    const total = allPhotoIds.length;
    const paginatedIds = allPhotoIds.slice(offset, offset + limit);
    
    const photos: Photo[] = [];
    for (const id of paginatedIds) {
      const photo = this.photos.get(id);
      if (photo) photos.push(photo);
    }
    
    return { photos, total };
  }
}
