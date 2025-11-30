/**
 * Vision Provider Interface
 * 
 * Abstract interface for computer vision operations.
 * Implementations can use AWS Rekognition, Google Vision,
 * Azure Computer Vision, or custom ML models.
 */

import {
  DetectedFace,
  DetectedAttributes,
  DetectedText,
  PhotoDetectionResult,
  VisionProviderError,
} from './types';

/** Configuration for vision provider */
export interface VisionProviderConfig {
  /** Provider name for logging */
  name: string;
  /** API endpoint (if applicable) */
  endpoint?: string;
  /** API key or credentials */
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    apiKey?: string;
  };
  /** Processing options */
  options?: {
    /** Minimum face detection confidence (0-1) */
    minFaceConfidence?: number;
    /** Minimum text detection confidence (0-1) */
    minTextConfidence?: number;
    /** Maximum faces to detect per image */
    maxFaces?: number;
    /** Enable clothing analysis */
    enableClothingAnalysis?: boolean;
    /** Enable text/bib detection */
    enableTextDetection?: boolean;
  };
}

/** Result wrapper with error handling */
export type VisionResult<T> =
  | { success: true; data: T }
  | { success: false; error: VisionProviderError };

/**
 * Vision Provider Interface
 * 
 * All computer vision operations go through this interface,
 * allowing easy swapping of underlying implementations.
 */
export interface VisionProvider {
  /** Provider name for identification */
  readonly name: string;

  /**
   * Detect faces and compute embeddings for similarity matching.
   * 
   * @param imageBytes - Raw image data (JPEG, PNG, etc.)
   * @returns Array of detected faces with embeddings
   */
  detectFacesAndEmbeddings(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedFace[]>>;

  /**
   * Detect clothing attributes (colors, types, descriptors).
   * May also detect full person bounding boxes.
   * 
   * @param imageBytes - Raw image data
   * @returns Array of detected persons with clothing attributes
   */
  detectClothingAttributes(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedAttributes[]>>;

  /**
   * Detect text in image (optimized for bib/jersey numbers).
   * 
   * @param imageBytes - Raw image data
   * @returns Array of detected text with positions
   */
  detectText(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedText[]>>;

  /**
   * Perform full analysis (faces + clothing + text) in one call.
   * More efficient for providers that support batch operations.
   * 
   * @param imageBytes - Raw image data
   * @param photoId - Photo identifier for result tagging
   * @returns Complete detection result
   */
  analyzePhoto(
    imageBytes: ArrayBuffer,
    photoId: string
  ): Promise<VisionResult<PhotoDetectionResult>>;

  /**
   * Compare two face embeddings for similarity.
   * 
   * @param embedding1 - First face embedding
   * @param embedding2 - Second face embedding
   * @returns Similarity score (0-1, higher = more similar)
   */
  compareFaces(
    embedding1: number[],
    embedding2: number[]
  ): number;

  /**
   * Health check for the provider.
   * 
   * @returns True if provider is operational
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Calculate cosine similarity between two embedding vectors.
 * Common utility used by all providers.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Euclidean distance between two embedding vectors.
 * Alternative to cosine similarity for some use cases.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have same length');
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}
