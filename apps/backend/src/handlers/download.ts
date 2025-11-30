/**
 * Download API Handler
 * 
 * Generate and serve ZIP archives of selected photos.
 */

import type { RouteContext } from '../utils/router';
import { jsonResponse, errorResponse, parseJsonBody } from '../utils/router';
import type { StorageService } from '../storage/types';

export interface DownloadHandlerEnv {
  storage: StorageService;
  PHOTOS_BUCKET?: R2Bucket;
}

/** Download request body */
interface DownloadRequest {
  photoIds: string[];
}

/**
 * POST /api/events/:eventId/download
 * 
 * Generate a ZIP archive of selected photos.
 * Returns the ZIP file directly for download.
 * 
 * Note: This is a simplified implementation. In production,
 * consider generating the ZIP asynchronously and returning a URL.
 */
export async function handleDownload(
  ctx: RouteContext<DownloadHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage, PHOTOS_BUCKET } = ctx.env;
  
  // Verify event exists
  const event = await storage.getEvent(eventId);
  if (!event) {
    return errorResponse('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  // Parse request body
  const body = await parseJsonBody<DownloadRequest>(ctx.request);
  
  if (!body?.photoIds || !Array.isArray(body.photoIds) || body.photoIds.length === 0) {
    return errorResponse('Photo IDs array is required', 400, 'MISSING_PHOTO_IDS');
  }
  
  // Limit the number of photos to prevent abuse
  const MAX_PHOTOS = 100;
  if (body.photoIds.length > MAX_PHOTOS) {
    return errorResponse(
      `Maximum ${MAX_PHOTOS} photos allowed per download`,
      400,
      'TOO_MANY_PHOTOS'
    );
  }
  
  // Collect photos
  const photos: { name: string; data: ArrayBuffer }[] = [];
  const errors: string[] = [];
  
  for (const photoId of body.photoIds) {
    const photo = await storage.getPhoto(photoId);
    
    if (!photo) {
      errors.push(`Photo ${photoId} not found`);
      continue;
    }
    
    if (photo.eventId !== eventId) {
      errors.push(`Photo ${photoId} does not belong to this event`);
      continue;
    }
    
    // Get photo data
    let imageData: ArrayBuffer | null = null;
    
    if (PHOTOS_BUCKET && !photo.originalUrl.startsWith('data:')) {
      // Fetch from R2
      const object = await PHOTOS_BUCKET.get(photo.originalUrl);
      if (object) {
        imageData = await object.arrayBuffer();
      }
    } else if (photo.originalUrl.startsWith('data:')) {
      // Parse data URL
      const base64Match = photo.originalUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (base64Match) {
        imageData = base64ToArrayBuffer(base64Match[1]);
      }
    }
    
    if (imageData) {
      // Generate a clean filename
      const ext = getExtensionFromMimeType(photo.mimeType);
      const name = `photo_${photoId}${ext}`;
      photos.push({ name, data: imageData });
    } else {
      errors.push(`Could not retrieve data for photo ${photoId}`);
    }
  }
  
  if (photos.length === 0) {
    return errorResponse('No photos could be retrieved', 400, 'NO_PHOTOS');
  }
  
  // Generate ZIP file
  // Note: This is a simplified implementation without actual ZIP compression
  // In production, use a proper ZIP library like JSZip
  
  // For now, if there's only one photo, return it directly
  if (photos.length === 1) {
    return new Response(photos[0].data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${photos[0].name}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // For multiple photos, we need ZIP functionality
  // Since we can't easily create ZIP in Workers without external deps,
  // return a JSON response with download URLs instead
  return jsonResponse({
    success: true,
    message: `Prepared ${photos.length} photo(s) for download`,
    note: 'Direct ZIP download not yet implemented. Please download photos individually.',
    photos: photos.map(p => ({
      name: p.name,
      size: p.data.byteLength,
    })),
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/photos/:photoId/download
 * 
 * Download a single photo.
 */
export async function handleSingleDownload(
  ctx: RouteContext<DownloadHandlerEnv>
): Promise<Response> {
  const { photoId } = ctx.params;
  const { storage, PHOTOS_BUCKET } = ctx.env;
  
  const photo = await storage.getPhoto(photoId);
  if (!photo) {
    return errorResponse('Photo not found', 404, 'PHOTO_NOT_FOUND');
  }
  
  // Get photo data
  let imageData: ArrayBuffer | null = null;
  
  if (PHOTOS_BUCKET && !photo.originalUrl.startsWith('data:')) {
    const object = await PHOTOS_BUCKET.get(photo.originalUrl);
    if (object) {
      imageData = await object.arrayBuffer();
    }
  } else if (photo.originalUrl.startsWith('data:')) {
    const base64Match = photo.originalUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (base64Match) {
      imageData = base64ToArrayBuffer(base64Match[1]);
    }
  }
  
  if (!imageData) {
    return errorResponse('Could not retrieve photo data', 500, 'FILE_ACCESS_ERROR');
  }
  
  const ext = getExtensionFromMimeType(photo.mimeType);
  const filename = `photo_${photoId}${ext}`;
  
  return new Response(imageData, {
    status: 200,
    headers: {
      'Content-Type': photo.mimeType || 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': imageData.byteLength.toString(),
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ============================================
// Helper Functions
// ============================================

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return map[mimeType] || '.jpg';
}
