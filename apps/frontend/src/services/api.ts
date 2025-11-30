/**
 * CrowdLens API Client
 * 
 * Type-safe client for the CrowdLens backend API.
 * Handles photo upload, search, and cluster management.
 */

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// ============================================
// Types
// ============================================

/** API error response */
export interface ApiError {
  error: boolean;
  message: string;
  code: string;
}

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Photo upload result */
export interface PhotoUploadResult {
  photoId: string;
  fileName: string;
  status: 'uploaded' | 'error';
  thumbnailUrl?: string;
  error?: string;
}

/** Upload response */
export interface UploadResponse {
  success: boolean;
  message: string;
  photos: PhotoUploadResult[];
}

/** Photo metadata for upload */
export interface PhotoUploadMetadata {
  fileName: string;
  mimeType: string;
  fileSize: number;
  exifTakenAt?: string;
  geo?: { lat: number; lng: number };
  cameraMake?: string;
  cameraModel?: string;
  width?: number;
  height?: number;
}

/** Processing status */
export type ProcessingStatus = 'pending' | 'processing' | 'processed' | 'failed';

/** Photo from API */
export interface ApiPhoto {
  id: string;
  eventId: string;
  thumbnailUrl: string;
  originalUrl?: string;
  width?: number;
  height?: number;
  exifTakenAt?: string;
  geo?: { lat: number; lng: number };
  processingStatus: ProcessingStatus;
  uploadedAt: string;
}

/** Person cluster from API */
export interface ApiCluster {
  id: string;
  eventId?: string;
  displayName?: string;
  tags: string[];
  faceCount: number;
  photoCount: number;
  representativeThumbnailUrl?: string;
  isClaimed: boolean;
  createdAt?: string;
}

/** Cluster search result */
export interface ClusterSearchResult {
  cluster: ApiCluster;
  similarity: number;
  matchingPhotos: {
    photoId: string;
    thumbnailUrl: string;
    confidence: number;
  }[];
  totalPhotoCount: number;
}

/** Clothing color options */
export type ClothingColor =
  | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
  | 'pink' | 'brown' | 'black' | 'white' | 'gray' | 'navy';

/** Clothing search filters */
export interface ClothingSearchFilters {
  primaryColor?: ClothingColor;
  secondaryColor?: ClothingColor;
  descriptor?: string;
}

// ============================================
// API Client Class
// ============================================

class CrowdLensApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ----------------------------------------
  // Generic fetch wrapper
  // ----------------------------------------

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return data as T;
  }

  // ----------------------------------------
  // Health Check
  // ----------------------------------------

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.fetch('/api/health');
  }

  // ----------------------------------------
  // Photo Operations
  // ----------------------------------------

  /**
   * Upload photos to an event.
   */
  async uploadPhotos(
    eventId: string,
    files: File[],
    metadata?: PhotoUploadMetadata[],
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append('files[]', file);
    });
    
    // Add metadata if provided
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    // Note: For progress tracking, you'd need XMLHttpRequest instead of fetch
    // This is a simplified implementation
    const response = await fetch(`${this.baseUrl}/api/events/${eventId}/photos`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error((data as ApiError).message || 'Upload failed');
    }

    return data as UploadResponse;
  }

  /**
   * List photos for an event.
   */
  async listPhotos(eventId: string): Promise<{
    photos: ApiPhoto[];
    total: number;
  }> {
    return this.fetch(`/api/events/${eventId}/photos`);
  }

  /**
   * Get photo details.
   */
  async getPhoto(photoId: string): Promise<{
    photo: ApiPhoto;
    detections: {
      faces: { id: string; boundingBox: object; confidence: number; clusterId?: string }[];
      clothing: { id: string; dominantColors: string[]; descriptors: string[] }[];
      bibs: { id: string; bibNumber: string; confidence: number }[];
    };
  }> {
    return this.fetch(`/api/photos/${photoId}`);
  }

  /**
   * Trigger photo processing.
   */
  async processPhoto(photoId: string): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/api/photos/${photoId}/process`, {
      method: 'POST',
    });
  }

  /**
   * Delete a photo.
   */
  async deletePhoto(photoId: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  // ----------------------------------------
  // Search Operations
  // ----------------------------------------

  /**
   * Search by face (upload selfie).
   */
  async searchByFace(
    eventId: string,
    referenceImage: File | string,
    threshold?: number
  ): Promise<{
    clusters: ClusterSearchResult[];
    total: number;
  }> {
    let imageDataUrl: string;
    
    if (typeof referenceImage === 'string') {
      // Already a data URL
      imageDataUrl = referenceImage;
    } else {
      // Convert File to data URL
      imageDataUrl = await fileToDataUrl(referenceImage);
    }

    return this.fetch(`/api/events/${eventId}/search/face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referenceImage: imageDataUrl,
        threshold,
      }),
    });
  }

  /**
   * Search by bib/jersey number.
   */
  async searchByBib(
    eventId: string,
    bibNumber: string
  ): Promise<{
    clusters: ClusterSearchResult[];
    total: number;
  }> {
    const params = new URLSearchParams({ bib: bibNumber });
    return this.fetch(`/api/events/${eventId}/search/bib?${params}`);
  }

  /**
   * Search by clothing attributes.
   */
  async searchByClothing(
    eventId: string,
    filters: ClothingSearchFilters
  ): Promise<{
    clusters: ClusterSearchResult[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters.primaryColor) params.set('primaryColor', filters.primaryColor);
    if (filters.secondaryColor) params.set('secondaryColor', filters.secondaryColor);
    if (filters.descriptor) params.set('descriptor', filters.descriptor);
    
    return this.fetch(`/api/events/${eventId}/search/clothing?${params}`);
  }

  // ----------------------------------------
  // Cluster Operations
  // ----------------------------------------

  /**
   * List all clusters for an event.
   */
  async listClusters(eventId: string): Promise<{
    clusters: ApiCluster[];
    total: number;
  }> {
    return this.fetch(`/api/events/${eventId}/clusters`);
  }

  /**
   * Get cluster details.
   */
  async getCluster(clusterId: string): Promise<{
    cluster: ApiCluster;
    photos: ApiPhoto[];
    totalPhotos: number;
  }> {
    return this.fetch(`/api/clusters/${clusterId}`);
  }

  /**
   * Get cluster photos with pagination.
   */
  async getClusterPhotos(
    clusterId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    photos: ApiPhoto[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.fetch(`/api/clusters/${clusterId}/photos?${params}`);
  }

  /**
   * Claim a cluster.
   */
  async claimCluster(
    clusterId: string,
    displayName?: string
  ): Promise<{ success: boolean; cluster: ApiCluster }> {
    return this.fetch(`/api/clusters/${clusterId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
  }

  /**
   * Update cluster (e.g., change display name).
   */
  async updateCluster(
    clusterId: string,
    displayName: string
  ): Promise<{ success: boolean; cluster: ApiCluster }> {
    return this.fetch(`/api/clusters/${clusterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
  }

  /**
   * Submit match feedback.
   */
  async submitFeedback(
    clusterId: string,
    feedback: { photoId: string; isMatch: boolean }[]
  ): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/api/clusters/${clusterId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
  }

  // ----------------------------------------
  // Download Operations
  // ----------------------------------------

  /**
   * Get download URL for a single photo.
   */
  getPhotoDownloadUrl(photoId: string): string {
    return `${this.baseUrl}/api/photos/${photoId}/download`;
  }

  /**
   * Request bulk download (returns info about prepared photos).
   */
  async requestBulkDownload(
    eventId: string,
    photoIds: string[]
  ): Promise<{
    success: boolean;
    message: string;
    photos: { name: string; size: number }[];
  }> {
    return this.fetch(`/api/events/${eventId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoIds }),
    });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert a File to a data URL.
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ============================================
// Export
// ============================================

/** Singleton API client instance */
export const api = new CrowdLensApi();

/** Export class for custom instances */
export { CrowdLensApi };
