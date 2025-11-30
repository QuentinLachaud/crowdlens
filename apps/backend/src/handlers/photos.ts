/**
 * Photo API Handlers
 * 
 * Endpoints for photo upload, processing, and management.
 */

import type { RouteContext } from '../utils/router';
import { jsonResponse, errorResponse, parseJsonBody } from '../utils/router';
import type { StorageService } from '../storage/types';
import type { VisionProvider } from '../vision';
import type { PhotoInput, GeoLocation } from '../models';
import { processPhoto } from '../services/processing';

export interface PhotoHandlerEnv {
  storage: StorageService;
  visionProvider: VisionProvider;
  // R2 bucket for file storage (optional, for production)
  PHOTOS_BUCKET?: R2Bucket;
}

/** Uploaded file metadata from client */
interface UploadMetadata {
  fileName: string;
  mimeType: string;
  fileSize: number;
  exifTakenAt?: string;
  geo?: GeoLocation;
  cameraMake?: string;
  cameraModel?: string;
  width?: number;
  height?: number;
}

/**
 * POST /api/events/:eventId/photos
 * 
 * Upload one or more photos to an event.
 * Accepts multipart/form-data with:
 * - files[]: Image files
 * - metadata: JSON array of UploadMetadata
 */
export async function handlePhotoUpload(
  ctx: RouteContext<PhotoHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage, visionProvider, PHOTOS_BUCKET } = ctx.env;
  
  // Verify event exists
  const event = await storage.getEvent(eventId);
  if (!event) {
    return errorResponse('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await ctx.request.formData();
  } catch {
    return errorResponse('Invalid form data', 400, 'INVALID_FORM_DATA');
  }
  
  // Get files and metadata
  const allFiles = formData.getAll('files[]');
  const files: File[] = [];
  for (const f of allFiles) {
    if (typeof f !== 'string' && 'arrayBuffer' in f) {
      files.push(f as File);
    }
  }
  const metadataJson = formData.get('metadata') as string | null;
  
  if (files.length === 0) {
    return errorResponse('No files provided', 400, 'NO_FILES');
  }
  
  // Parse metadata if provided
  let metadata: UploadMetadata[] = [];
  if (metadataJson) {
    try {
      metadata = JSON.parse(metadataJson);
    } catch {
      // Metadata is optional, continue without it
    }
  }
  
  const results: {
    photoId: string;
    fileName: string;
    status: 'uploaded' | 'error';
    thumbnailUrl?: string;
    error?: string;
  }[] = [];
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileMeta = metadata[i] ?? {
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      fileSize: file.size,
    };
    
    try {
      // Read file bytes
      const bytes = await file.arrayBuffer();
      
      // Generate storage URLs
      // In production, upload to R2; in dev, use data URL
      let originalUrl: string;
      let thumbnailUrl: string;
      
      if (PHOTOS_BUCKET) {
        // Production: Upload to R2
        const key = `events/${eventId}/${Date.now()}-${file.name}`;
        await PHOTOS_BUCKET.put(key, bytes, {
          httpMetadata: { contentType: file.type },
        });
        originalUrl = key;
        thumbnailUrl = key; // TODO: Generate actual thumbnail
      } else {
        // Development: Use base64 data URL
        const base64 = arrayBufferToBase64(bytes);
        originalUrl = `data:${file.type};base64,${base64}`;
        thumbnailUrl = originalUrl; // Same as original for now
      }
      
      // Create photo record
      const photoInput: PhotoInput = {
        eventId,
        originalUrl,
        thumbnailUrl,
        mimeType: fileMeta.mimeType,
        fileSize: fileMeta.fileSize,
        width: fileMeta.width,
        height: fileMeta.height,
        exifTakenAt: fileMeta.exifTakenAt,
        geo: fileMeta.geo,
        cameraMake: fileMeta.cameraMake,
        cameraModel: fileMeta.cameraModel,
      };
      
      const photo = await storage.createPhoto(photoInput);
      
      // Start processing (async in production, sync in dev)
      processPhoto(photo, bytes, visionProvider, storage).catch(() => {
        // Processing errors are stored in the photo record
      });
      
      results.push({
        photoId: photo.id,
        fileName: file.name,
        status: 'uploaded',
        thumbnailUrl: photo.thumbnailUrl,
      });
    } catch (error) {
      results.push({
        photoId: '',
        fileName: file.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }
  
  const uploaded = results.filter(r => r.status === 'uploaded').length;
  const failed = results.filter(r => r.status === 'error').length;
  
  return jsonResponse({
    success: true,
    message: `Uploaded ${uploaded} photo(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    photos: results,
  }, uploaded > 0 ? 201 : 400);
}

/**
 * POST /api/photos/:photoId/process
 * 
 * Trigger processing for a specific photo.
 * Useful for retrying failed processing or manual triggers.
 */
export async function handlePhotoProcess(
  ctx: RouteContext<PhotoHandlerEnv>
): Promise<Response> {
  const { photoId } = ctx.params;
  const { storage, visionProvider, PHOTOS_BUCKET } = ctx.env;
  
  // Get photo
  const photo = await storage.getPhoto(photoId);
  if (!photo) {
    return errorResponse('Photo not found', 404, 'PHOTO_NOT_FOUND');
  }
  
  // Check if already processing
  if (photo.processingStatus === 'processing') {
    return errorResponse('Photo is already being processed', 409, 'ALREADY_PROCESSING');
  }
  
  // Get image bytes
  let imageBytes: ArrayBuffer;
  
  if (PHOTOS_BUCKET && !photo.originalUrl.startsWith('data:')) {
    // Fetch from R2
    const object = await PHOTOS_BUCKET.get(photo.originalUrl);
    if (!object) {
      return errorResponse('Photo file not found', 404, 'FILE_NOT_FOUND');
    }
    imageBytes = await object.arrayBuffer();
  } else if (photo.originalUrl.startsWith('data:')) {
    // Parse data URL
    const base64 = photo.originalUrl.split(',')[1];
    imageBytes = base64ToArrayBuffer(base64);
  } else {
    return errorResponse('Cannot retrieve photo file', 500, 'FILE_ACCESS_ERROR');
  }
  
  // Process the photo
  const result = await processPhoto(photo, imageBytes, visionProvider, storage);
  
  if (result.success) {
    return jsonResponse({
      success: true,
      message: 'Photo processed successfully',
      photoId,
    });
  } else {
    return errorResponse(
      result.error ?? 'Processing failed',
      500,
      'PROCESSING_FAILED'
    );
  }
}

/**
 * GET /api/events/:eventId/photos
 * 
 * List all photos for an event.
 */
export async function handleListPhotos(
  ctx: RouteContext<PhotoHandlerEnv>
): Promise<Response> {
  const { eventId } = ctx.params;
  const { storage } = ctx.env;
  
  // Verify event exists
  const event = await storage.getEvent(eventId);
  if (!event) {
    return errorResponse('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  const photos = await storage.getPhotosByEvent(eventId);
  
  return jsonResponse({
    success: true,
    eventId,
    photos: photos.map(p => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      exifTakenAt: p.exifTakenAt,
      geo: p.geo,
      processingStatus: p.processingStatus,
      uploadedAt: p.uploadedAt,
    })),
    total: photos.length,
  });
}

/**
 * GET /api/photos/:photoId
 * 
 * Get details for a specific photo.
 */
export async function handleGetPhoto(
  ctx: RouteContext<PhotoHandlerEnv>
): Promise<Response> {
  const { photoId } = ctx.params;
  const { storage } = ctx.env;
  
  const photo = await storage.getPhoto(photoId);
  if (!photo) {
    return errorResponse('Photo not found', 404, 'PHOTO_NOT_FOUND');
  }
  
  // Get associated detections
  const [faces, clothing, bibs] = await Promise.all([
    storage.getFaceDetectionsByPhoto(photoId),
    storage.getClothingByPhoto(photoId),
    storage.getBibsByPhoto(photoId),
  ]);
  
  return jsonResponse({
    success: true,
    photo: {
      id: photo.id,
      eventId: photo.eventId,
      thumbnailUrl: photo.thumbnailUrl,
      originalUrl: photo.originalUrl,
      width: photo.width,
      height: photo.height,
      exifTakenAt: photo.exifTakenAt,
      geo: photo.geo,
      processingStatus: photo.processingStatus,
      uploadedAt: photo.uploadedAt,
    },
    detections: {
      faces: faces.map(f => ({
        id: f.id,
        boundingBox: f.boundingBox,
        confidence: f.confidence,
        clusterId: f.clusterId,
      })),
      clothing: clothing.map(c => ({
        id: c.id,
        dominantColors: c.dominantColors,
        descriptors: c.descriptors,
      })),
      bibs: bibs.map(b => ({
        id: b.id,
        bibNumber: b.bibNumber,
        confidence: b.confidence,
      })),
    },
  });
}

/**
 * DELETE /api/photos/:photoId
 * 
 * Delete a photo.
 */
export async function handleDeletePhoto(
  ctx: RouteContext<PhotoHandlerEnv>
): Promise<Response> {
  const { photoId } = ctx.params;
  const { storage, PHOTOS_BUCKET } = ctx.env;
  
  const photo = await storage.getPhoto(photoId);
  if (!photo) {
    return errorResponse('Photo not found', 404, 'PHOTO_NOT_FOUND');
  }
  
  // Delete from R2 if applicable
  if (PHOTOS_BUCKET && !photo.originalUrl.startsWith('data:')) {
    await PHOTOS_BUCKET.delete(photo.originalUrl);
  }
  
  // Delete from database
  await storage.deletePhoto(photoId);
  
  return jsonResponse({
    success: true,
    message: 'Photo deleted',
    photoId,
  });
}

// ============================================
// Utility Functions
// ============================================

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
