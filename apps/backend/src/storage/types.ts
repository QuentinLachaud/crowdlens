/**
 * Storage Service Types
 * 
 * Abstract interfaces for data persistence.
 * Implementations can use D1, KV, or in-memory storage.
 */

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

/**
 * Storage Service Interface
 * 
 * Abstract layer for all data persistence operations.
 * Implementations can use different backends (D1, KV, etc.)
 */
export interface StorageService {
  // ============================================
  // Event Operations
  // ============================================
  
  getEvent(eventId: string): Promise<Event | null>;
  listEvents(): Promise<Event[]>;
  createEvent(event: Omit<Event, 'createdAt' | 'updatedAt'>): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null>;
  deleteEvent(eventId: string): Promise<boolean>;
  
  // ============================================
  // Photo Operations
  // ============================================
  
  getPhoto(photoId: string): Promise<Photo | null>;
  getPhotosByEvent(eventId: string): Promise<Photo[]>;
  createPhoto(input: PhotoInput): Promise<Photo>;
  updatePhotoStatus(
    photoId: string,
    status: ProcessingStatus,
    error?: string
  ): Promise<Photo | null>;
  deletePhoto(photoId: string): Promise<boolean>;
  
  // ============================================
  // Face Detection Operations
  // ============================================
  
  getFaceDetection(faceId: string): Promise<FaceDetection | null>;
  getFaceDetectionsByPhoto(photoId: string): Promise<FaceDetection[]>;
  getFaceDetectionsByCluster(clusterId: string): Promise<FaceDetection[]>;
  createFaceDetection(input: FaceDetectionInput): Promise<FaceDetection>;
  updateFaceCluster(
    faceId: string,
    clusterId: string,
    confidence: number
  ): Promise<FaceDetection | null>;
  
  // ============================================
  // Person Cluster Operations
  // ============================================
  
  getCluster(clusterId: string): Promise<PersonCluster | null>;
  getClustersByEvent(eventId: string): Promise<PersonCluster[]>;
  createCluster(input: PersonClusterInput): Promise<PersonCluster>;
  updateCluster(
    clusterId: string,
    updates: Partial<PersonCluster>
  ): Promise<PersonCluster | null>;
  deleteCluster(clusterId: string): Promise<boolean>;
  
  /** Get all face embeddings for an event (for clustering) */
  getEventEmbeddings(eventId: string): Promise<{
    faceId: string;
    clusterId: string | null;
    embedding: number[];
  }[]>;
  
  // ============================================
  // Clothing Attributes Operations
  // ============================================
  
  getClothingByPhoto(photoId: string): Promise<ClothingAttributes[]>;
  createClothingAttributes(input: ClothingAttributesInput): Promise<ClothingAttributes>;
  
  // ============================================
  // Bib Detection Operations
  // ============================================
  
  getBibsByPhoto(photoId: string): Promise<BibDetection[]>;
  createBibDetection(input: BibDetectionInput): Promise<BibDetection>;
  
  // ============================================
  // Match Feedback Operations
  // ============================================
  
  createMatchFeedback(
    clusterId: string,
    photoId: string,
    isMatch: boolean,
    userId?: string
  ): Promise<MatchFeedback>;
  getFeedbackByCluster(clusterId: string): Promise<MatchFeedback[]>;
  
  // ============================================
  // Search Operations
  // ============================================
  
  /** Search clusters by bib number */
  searchByBib(
    eventId: string,
    bibNumber: string
  ): Promise<ClusterSearchResult[]>;
  
  /** Search clusters by clothing attributes */
  searchByClothing(
    eventId: string,
    filters: ClothingSearchFilters
  ): Promise<ClusterSearchResult[]>;
  
  /** Search clusters by face embedding similarity */
  searchByFaceEmbedding(
    eventId: string,
    embedding: number[],
    threshold: number
  ): Promise<ClusterSearchResult[]>;
  
  /** Get photos for a cluster with pagination */
  getClusterPhotos(
    clusterId: string,
    limit?: number,
    offset?: number
  ): Promise<{ photos: Photo[]; total: number }>;
}
