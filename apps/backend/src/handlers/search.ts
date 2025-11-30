/**
 * Search API Handlers
 * 
 * Endpoints for finding yourself in photos via face, bib, or clothing.
 */

import type { RouteContext } from '../utils/router';
import { jsonResponse, errorResponse, parseJsonBody } from '../utils/router';
import type { StorageService } from '../storage/types';
import type { VisionProvider, ClothingColor, ClothingType } from '../vision';
import type { ClothingSearchFilters, ClusterSearchResult } from '../models';

export interface SearchHandlerEnv {
  storage: StorageService;
  visionProvider: VisionProvider;
}

/** Face search request body */
interface FaceSearchRequest {
  // Reference image as base64 data URL
  referenceImage?: string;
  // Similarity threshold override (0-1)
  threshold?: number;
}

/** Bib search query params */
interface BibSearchParams {
  bib: string;
}

/** Clothing search query params */
interface ClothingSearchParams {
  primaryColor?: ClothingColor;
  secondaryColor?: ClothingColor;
  clothingType?: ClothingType;
  descriptor?: string;
}

/**
 * POST /api/events/:eventId/search/face
 * 
 * Search for photos containing a similar face.
 * Body should contain a selfie/reference image.
 */
export async function handleFaceSearch(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage, visionProvider } = ctx.env;
  
  // Check if event exists (if not, we'll run in demo mode)
  const event = await storage.getEvent(eventId);
  const isDemoMode = !event;
  
  // Parse request body
  let body: FaceSearchRequest | null = null;
  
  // Try JSON body first
  const contentType = ctx.request.headers.get('content-type') ?? '';
  
  if (contentType.includes('application/json')) {
    body = await parseJsonBody<FaceSearchRequest>(ctx.request);
  } else if (contentType.includes('multipart/form-data')) {
    // Handle form data with image file
    try {
      const formData = await ctx.request.formData();
      const file = formData.get('image');
      
      if (file && typeof file !== 'string' && 'arrayBuffer' in file) {
        const bytes = await (file as File).arrayBuffer();
        const base64 = arrayBufferToBase64(bytes);
        const mimeType = (file as File).type || 'image/jpeg';
        body = {
          referenceImage: `data:${mimeType};base64,${base64}`,
          threshold: parseFloat(formData.get('threshold') as string) || undefined,
        };
      }
    } catch {
      return errorResponse('Invalid form data', 400, 'INVALID_FORM_DATA');
    }
  }
  
  if (!body?.referenceImage) {
    return errorResponse('Reference image is required', 400, 'MISSING_IMAGE');
  }
  
  // Extract image bytes from data URL
  const base64Match = body.referenceImage.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!base64Match) {
    return errorResponse('Invalid image format', 400, 'INVALID_IMAGE');
  }
  
  const imageBytes = base64ToArrayBuffer(base64Match[1]);
  
  // Detect faces in reference image
  const facesResult = await visionProvider.detectFacesAndEmbeddings(imageBytes);
  
  if (!facesResult.success) {
    return errorResponse(
      'Failed to analyze reference image',
      500,
      'FACE_DETECTION_FAILED'
    );
  }
  
  if (facesResult.data.length === 0) {
    return jsonResponse({
      success: true,
      message: 'No face detected in reference image',
      clusters: [],
    });
  }
  
  // Use the first (most prominent) face
  const referenceEmbedding = facesResult.data[0].embedding;
  const threshold = body.threshold ?? 0.6;
  
  // In demo mode, return mock results
  if (isDemoMode) {
    return jsonResponse({
      success: true,
      eventId,
      searchType: 'face',
      threshold,
      demoMode: true,
      message: 'Demo mode: Backend has no photos for this event yet. Upload photos to the backend to enable real face matching.',
      clusters: [
        {
          clusterId: 'demo-cluster-1',
          displayName: 'Demo Person',
          photoCount: 5,
          faceCount: 7,
          similarity: 0.92,
          isClaimed: false,
          representativeThumbnailUrl: null,
          matchingPhotos: [
            { photoId: 'demo-1', thumbnailUrl: '/demo/photo1.jpg', confidence: 0.95 },
            { photoId: 'demo-2', thumbnailUrl: '/demo/photo2.jpg', confidence: 0.89 },
            { photoId: 'demo-3', thumbnailUrl: '/demo/photo3.jpg', confidence: 0.85 },
          ],
          totalPhotoCount: 5,
        },
      ],
      total: 1,
    });
  }
  
  // Search for matching clusters
  const clusters = await storage.searchByFaceEmbedding(
    eventId,
    referenceEmbedding,
    threshold
  );
  
  return jsonResponse({
    success: true,
    eventId,
    searchType: 'face',
    threshold,
    clusters: clusters.map(formatClusterResult),
    total: clusters.length,
  });
}

/**
 * GET /api/events/:eventId/search/bib
 * 
 * Search for photos by bib/jersey number.
 * Query params: ?bib=1427
 */
export async function handleBibSearch(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage } = ctx.env;
  
  // Check if event exists (if not, run in demo mode)
  const event = await storage.getEvent(eventId);
  const isDemoMode = !event;
  
  // Get bib number from query params
  const url = new URL(ctx.request.url);
  const bibNumber = url.searchParams.get('bib');
  
  if (!bibNumber || bibNumber.trim() === '') {
    return errorResponse('Bib number is required', 400, 'MISSING_BIB');
  }
  
  // In demo mode, return mock results
  if (isDemoMode) {
    return jsonResponse({
      success: true,
      eventId,
      searchType: 'bib',
      query: bibNumber.trim(),
      demoMode: true,
      message: 'Demo mode: Backend has no photos for this event yet.',
      clusters: [
        {
          clusterId: 'demo-bib-cluster',
          displayName: `Runner #${bibNumber.trim()}`,
          photoCount: 3,
          faceCount: 3,
          similarity: 1.0,
          isClaimed: false,
          representativeThumbnailUrl: null,
          matchingPhotos: [
            { photoId: 'demo-bib-1', thumbnailUrl: '/demo/bib1.jpg', confidence: 0.98 },
            { photoId: 'demo-bib-2', thumbnailUrl: '/demo/bib2.jpg', confidence: 0.95 },
          ],
          totalPhotoCount: 3,
        },
      ],
      total: 1,
    });
  }
  
  // Search for matching clusters
  const clusters = await storage.searchByBib(eventId, bibNumber.trim());
  
  return jsonResponse({
    success: true,
    eventId,
    searchType: 'bib',
    query: bibNumber.trim(),
    clusters: clusters.map(formatClusterResult),
    total: clusters.length,
  });
}

/**
 * GET /api/events/:eventId/search/clothing
 * 
 * Search for photos by clothing attributes.
 * Query params: ?primaryColor=red&descriptor=red+jacket
 */
export async function handleClothingSearch(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage } = ctx.env;
  
  // Check if event exists (if not, run in demo mode)
  const event = await storage.getEvent(eventId);
  const isDemoMode = !event;
  
  // Get filters from query params
  const url = new URL(ctx.request.url);
  const filters: ClothingSearchFilters = {};
  
  const primaryColor = url.searchParams.get('primaryColor');
  const secondaryColor = url.searchParams.get('secondaryColor');
  const clothingType = url.searchParams.get('clothingType');
  const descriptor = url.searchParams.get('descriptor');
  
  if (primaryColor) filters.primaryColor = primaryColor as ClothingColor;
  if (secondaryColor) filters.secondaryColor = secondaryColor as ClothingColor;
  if (clothingType) filters.clothingType = clothingType as ClothingType;
  if (descriptor) filters.descriptor = descriptor;
  
  // Require at least one filter
  if (Object.keys(filters).length === 0) {
    return errorResponse(
      'At least one filter is required (primaryColor, secondaryColor, clothingType, descriptor)',
      400,
      'MISSING_FILTERS'
    );
  }
  
  // In demo mode, return mock results
  if (isDemoMode) {
    const colorLabel = primaryColor || descriptor || 'matching';
    return jsonResponse({
      success: true,
      eventId,
      searchType: 'clothing',
      filters,
      demoMode: true,
      message: 'Demo mode: Backend has no photos for this event yet.',
      clusters: [
        {
          clusterId: 'demo-clothing-cluster',
          displayName: `Person in ${colorLabel}`,
          photoCount: 4,
          faceCount: 4,
          similarity: 0.85,
          isClaimed: false,
          representativeThumbnailUrl: null,
          matchingPhotos: [
            { photoId: 'demo-cloth-1', thumbnailUrl: '/demo/cloth1.jpg', confidence: 0.90 },
            { photoId: 'demo-cloth-2', thumbnailUrl: '/demo/cloth2.jpg', confidence: 0.82 },
          ],
          totalPhotoCount: 4,
        },
      ],
      total: 1,
    });
  }
  
  // Search for matching clusters
  const clusters = await storage.searchByClothing(eventId, filters);
  
  return jsonResponse({
    success: true,
    eventId,
    searchType: 'clothing',
    filters,
    clusters: clusters.map(formatClusterResult),
    total: clusters.length,
  });
}

/**
 * GET /api/events/:eventId/clusters
 * 
 * List all person clusters for an event.
 */
export async function handleListClusters(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage } = ctx.env;
  
  // Check if event exists (if not, run in demo mode)
  const event = await storage.getEvent(eventId);
  
  if (!event) {
    // Demo mode - return empty clusters with helpful message
    return jsonResponse({
      success: true,
      eventId,
      demoMode: true,
      message: 'Demo mode: No clusters found. Upload photos to the backend to enable clustering.',
      clusters: [],
      total: 0,
    });
  }
  
  const clusters = await storage.getClustersByEvent(eventId);
  
  return jsonResponse({
    success: true,
    eventId,
    clusters: clusters.map(c => ({
      id: c.id,
      displayName: c.displayName,
      tags: c.tags,
      faceCount: c.faceCount,
      photoCount: c.photoCount,
      representativeThumbnailUrl: c.representativeThumbnailUrl,
      isClaimed: !!c.claimedBy,
      createdAt: c.createdAt,
    })),
    total: clusters.length,
  });
}

/**
 * GET /api/clusters/:clusterId
 * 
 * Get details for a specific cluster.
 */
export async function handleGetCluster(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  // Get photos for this cluster
  const { photos, total } = await storage.getClusterPhotos(clusterId, 20);
  
  return jsonResponse({
    success: true,
    cluster: {
      id: cluster.id,
      eventId: cluster.eventId,
      displayName: cluster.displayName,
      tags: cluster.tags,
      faceCount: cluster.faceCount,
      photoCount: cluster.photoCount,
      representativeThumbnailUrl: cluster.representativeThumbnailUrl,
      isClaimed: !!cluster.claimedBy,
      createdAt: cluster.createdAt,
      updatedAt: cluster.updatedAt,
    },
    photos: photos.map(p => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      exifTakenAt: p.exifTakenAt,
    })),
    totalPhotos: total,
  });
}

/**
 * GET /api/clusters/:clusterId/photos
 * 
 * Get paginated photos for a cluster.
 */
export async function handleGetClusterPhotos(
  ctx: RouteContext<SearchHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  // Get pagination from query params
  const url = new URL(ctx.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');
  
  const { photos, total } = await storage.getClusterPhotos(clusterId, limit, offset);
  
  return jsonResponse({
    success: true,
    clusterId,
    photos: photos.map(p => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      originalUrl: p.originalUrl,
      exifTakenAt: p.exifTakenAt,
      geo: p.geo,
    })),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + photos.length < total,
    },
  });
}

// ============================================
// Helper Functions
// ============================================

function formatClusterResult(result: ClusterSearchResult) {
  return {
    cluster: {
      id: result.cluster.id,
      displayName: result.cluster.displayName,
      tags: result.cluster.tags,
      faceCount: result.cluster.faceCount,
      photoCount: result.cluster.photoCount,
      representativeThumbnailUrl: result.cluster.representativeThumbnailUrl,
      isClaimed: !!result.cluster.claimedBy,
    },
    similarity: Math.round(result.similarity * 100) / 100,
    matchingPhotos: result.matchingPhotos.slice(0, 5), // Limit preview photos
    totalPhotoCount: result.totalPhotoCount,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
