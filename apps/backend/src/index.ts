/**
 * CrowdLens Backend API
 * 
 * Cloudflare Worker for photo processing, face detection,
 * and "Find Yourself" features.
 */

import { Router, handleCors, jsonResponse, errorResponse, corsHeaders } from './utils/router';
import { InMemoryStorage } from './storage';
import { createVisionProvider } from './vision';

// Handlers
import {
  handlePhotoUpload,
  handlePhotoProcess,
  handleListPhotos,
  handleGetPhoto,
  handleDeletePhoto,
  type PhotoHandlerEnv,
} from './handlers/photos';
import {
  handleFaceSearch,
  handleBibSearch,
  handleClothingSearch,
  handleListClusters,
  handleGetCluster,
  handleGetClusterPhotos,
  type SearchHandlerEnv,
} from './handlers/search';
import {
  handleClaimCluster,
  handleUpdateCluster,
  handleClusterFeedback,
  handleGetFeedback,
  handleUnclaimCluster,
  type ClusterHandlerEnv,
} from './handlers/clusters';
import {
  handleDownload,
  handleSingleDownload,
  type DownloadHandlerEnv,
} from './handlers/download';

/** Environment bindings */
export interface Env {
  // R2 bucket for photo storage (optional in development)
  PHOTOS_BUCKET?: R2Bucket;
  // Vision provider type (default: dummy)
  VISION_PROVIDER?: string;
  // AWS credentials for Rekognition (if using aws-rekognition provider)
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
}

/** Combined handler environment */
type HandlerEnv = PhotoHandlerEnv & SearchHandlerEnv & ClusterHandlerEnv & DownloadHandlerEnv;

// Global instances (per-request in Workers, but reused within request)
let storage: InMemoryStorage | null = null;

function getStorage(): InMemoryStorage {
  if (!storage) {
    storage = new InMemoryStorage();
  }
  return storage;
}

// Create router
const router = new Router<HandlerEnv>();

// ============================================
// Health & Info Routes
// ============================================

router.get('/api/health', () => {
  return jsonResponse({
    status: 'ok',
    service: 'crowdlens-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/api/info', () => {
  return jsonResponse({
    service: 'CrowdLens API',
    version: '1.0.0',
    features: [
      'Photo upload and management',
      'Face detection and clustering',
      'Bib/jersey number detection',
      'Clothing attribute analysis',
      'Person search (face, bib, clothing)',
    ],
  });
});

// ============================================
// Photo Routes
// ============================================

router.post('/api/events/:eventId/photos', handlePhotoUpload);
router.get('/api/events/:eventId/photos', handleListPhotos);
router.post('/api/photos/:photoId/process', handlePhotoProcess);
router.get('/api/photos/:photoId', handleGetPhoto);
router.delete('/api/photos/:photoId', handleDeletePhoto);
router.get('/api/photos/:photoId/download', handleSingleDownload);

// ============================================
// Search Routes
// ============================================

router.post('/api/events/:eventId/search/face', handleFaceSearch);
router.get('/api/events/:eventId/search/bib', handleBibSearch);
router.get('/api/events/:eventId/search/clothing', handleClothingSearch);
router.get('/api/events/:eventId/clusters', handleListClusters);
router.get('/api/clusters/:clusterId', handleGetCluster);
router.get('/api/clusters/:clusterId/photos', handleGetClusterPhotos);

// ============================================
// Cluster Management Routes
// ============================================

router.post('/api/clusters/:clusterId/claim', handleClaimCluster);
router.delete('/api/clusters/:clusterId/claim', handleUnclaimCluster);
router.put('/api/clusters/:clusterId', handleUpdateCluster);
router.post('/api/clusters/:clusterId/feedback', handleClusterFeedback);
router.get('/api/clusters/:clusterId/feedback', handleGetFeedback);

// ============================================
// Download Routes
// ============================================

router.post('/api/events/:eventId/download', handleDownload);

// ============================================
// Worker Entry Point
// ============================================

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }
    
    // Initialize services
    const storageInstance = getStorage();
    const visionProvider = createVisionProvider(
      (env.VISION_PROVIDER as 'dummy' | 'aws-rekognition' | 'google-vision') || 'dummy',
      {
        name: env.VISION_PROVIDER || 'dummy',
        credentials: env.AWS_ACCESS_KEY_ID ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          region: env.AWS_REGION || 'us-east-1',
        } : undefined,
      }
    );
    
    // Build handler environment
    const handlerEnv: HandlerEnv = {
      storage: storageInstance,
      visionProvider,
      PHOTOS_BUCKET: env.PHOTOS_BUCKET,
    };
    
    // Try to match route
    const response = await router.handle(request, handlerEnv, ctx);
    
    if (response) {
      return response;
    }
    
    // Check if it's an API route that wasn't found
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return errorResponse('Endpoint not found', 404, 'NOT_FOUND');
    }
    
    // For non-API routes, return basic info
    return new Response('CrowdLens API - Use /api/* endpoints', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    });
  },
};
