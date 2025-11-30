/**
 * Backend Data Models
 * 
 * Core domain entities for CrowdLens "Find Yourself" features.
 * These models extend the existing Event/Photo models with
 * face detection, clothing analysis, and clustering data.
 */

import type { BoundingBox, ClothingColor, ClothingType } from '../vision/types';

// ============================================
// Base Types
// ============================================

/** Processing status for async operations */
export type ProcessingStatus = 'pending' | 'processing' | 'processed' | 'failed';

/** Geographic coordinates */
export interface GeoLocation {
  lat: number;
  lng: number;
}

// ============================================
// Event Model (Extended)
// ============================================

/**
 * Event - A collection of photos (race, festival, etc.)
 * Extended from frontend Event type with backend-specific fields.
 */
export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  geo?: GeoLocation;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  createdAt: string;
  updatedAt: string;
  
  // Stats (computed/cached)
  photoCount?: number;
  clusterCount?: number;
}

// ============================================
// Photo Model (Extended)
// ============================================

/**
 * Photo - Image with metadata and processing status.
 */
export interface Photo {
  id: string;
  eventId: string;
  
  // Storage URLs
  originalUrl: string;     // R2 or other storage
  thumbnailUrl: string;    // Smaller version for previews
  
  // Image properties
  width?: number;
  height?: number;
  mimeType: string;
  fileSize: number;
  
  // Metadata from EXIF
  exifTakenAt?: string;    // ISO date string
  geo?: GeoLocation;
  cameraMake?: string;
  cameraModel?: string;
  
  // Upload info
  uploadedAt: string;
  uploaderId?: string;     // For future auth
  
  // Processing status
  processingStatus: ProcessingStatus;
  processingError?: string;
  processedAt?: string;
}

/** Photo creation input (from upload) */
export interface PhotoInput {
  eventId: string;
  originalUrl: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  mimeType: string;
  fileSize: number;
  exifTakenAt?: string;
  geo?: GeoLocation;
  cameraMake?: string;
  cameraModel?: string;
  uploaderId?: string;
}

// ============================================
// Face Detection Model
// ============================================

/**
 * FaceDetection - A detected face within a photo.
 * Links to PersonCluster for grouping same individuals.
 */
export interface FaceDetection {
  id: string;
  photoId: string;
  
  // Detection data
  boundingBox: BoundingBox;
  confidence: number;
  
  // Embedding for similarity matching (stored as JSON string or binary)
  embedding: string; // Base64-encoded or JSON array
  
  // Clustering
  clusterId?: string;      // PersonCluster ID
  clusterConfidence?: number;
  
  // Metadata
  createdAt: string;
}

/** Face detection creation input */
export interface FaceDetectionInput {
  photoId: string;
  boundingBox: BoundingBox;
  confidence: number;
  embedding: number[];
}

// ============================================
// Person Cluster Model
// ============================================

/**
 * PersonCluster - A group of faces belonging to the same person.
 * Within a single event, faces are clustered by embedding similarity.
 */
export interface PersonCluster {
  id: string;
  eventId: string;
  
  // Representative face (for avatar display)
  representativeFaceId?: string;
  representativePhotoId?: string;
  representativeThumbnailUrl?: string;
  
  // User-provided info
  displayName?: string;
  
  // Auto-generated tags from detections
  tags: string[];          // e.g., ["bib:1427", "red jacket"]
  
  // Clustering metadata
  faceCount: number;
  photoCount: number;
  
  // Claim status
  claimedBy?: string;      // User ID who claimed this cluster
  claimedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/** Cluster creation input */
export interface PersonClusterInput {
  eventId: string;
  representativeFaceId?: string;
  representativePhotoId?: string;
  representativeThumbnailUrl?: string;
  tags?: string[];
}

// ============================================
// Clothing Attributes Model
// ============================================

/**
 * ClothingAttributes - Detected clothing on a person in a photo.
 */
export interface ClothingAttributes {
  id: string;
  photoId: string;
  faceDetectionId?: string;
  
  // Colors detected
  dominantColors: ClothingColor[];
  
  // Individual items
  items: {
    type: ClothingType;
    primaryColor: ClothingColor;
    secondaryColor?: ClothingColor;
    confidence: number;
  }[];
  
  // Text descriptors for search
  descriptors: string[];   // e.g., ["red jacket", "blue shorts"]
  
  // Metadata
  confidence: number;
  createdAt: string;
}

/** Clothing attributes creation input */
export interface ClothingAttributesInput {
  photoId: string;
  faceDetectionId?: string;
  dominantColors: ClothingColor[];
  items: ClothingAttributes['items'];
  descriptors: string[];
  confidence: number;
}

// ============================================
// Bib Detection Model
// ============================================

/**
 * BibDetection - Detected bib/jersey number in a photo.
 */
export interface BibDetection {
  id: string;
  photoId: string;
  faceDetectionId?: string;
  
  // Detection data
  bibNumber: string;
  boundingBox: BoundingBox;
  confidence: number;
  
  // Metadata
  createdAt: string;
}

/** Bib detection creation input */
export interface BibDetectionInput {
  photoId: string;
  faceDetectionId?: string;
  bibNumber: string;
  boundingBox: BoundingBox;
  confidence: number;
}

// ============================================
// Match Feedback Model
// ============================================

/**
 * MatchFeedback - User feedback on suggested photo matches.
 * Used to improve clustering over time.
 */
export interface MatchFeedback {
  id: string;
  clusterId: string;
  photoId: string;
  
  // Feedback
  isMatch: boolean;        // true = "this is me", false = "not me"
  userId?: string;
  
  // Timestamps
  createdAt: string;
}

// ============================================
// Search & Query Types
// ============================================

/** Clothing search filters */
export interface ClothingSearchFilters {
  primaryColor?: ClothingColor;
  secondaryColor?: ClothingColor;
  clothingType?: ClothingType;
  descriptor?: string;     // Free text like "red jacket"
}

/** Search result with confidence */
export interface ClusterSearchResult {
  cluster: PersonCluster;
  similarity: number;      // 0-1, higher = better match
  matchingPhotos: {
    photoId: string;
    thumbnailUrl: string;
    confidence: number;
  }[];
  totalPhotoCount: number;
}

/** Photo search result */
export interface PhotoSearchResult {
  photo: Photo;
  clusterId?: string;
  faceConfidence?: number;
  bibNumber?: string;
  clothingDescriptors?: string[];
}
