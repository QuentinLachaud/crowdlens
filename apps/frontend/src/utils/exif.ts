/**
 * EXIF metadata extraction utilities.
 * 
 * Extracts comprehensive metadata from photos including:
 * - Date/time taken (DateTimeOriginal, CreateDate)
 * - GPS coordinates (latitude, longitude)
 * - Camera info (make, model)
 * - Image dimensions
 */

import exifr from 'exifr';
import { Photo, PhotoMetadata } from '@/types';
import { generateId } from './helpers';
import { fileToDataUrl } from '@/services/storage';

/** EXIF tags to extract */
const EXIF_OPTIONS = {
  pick: [
    'DateTimeOriginal',
    'CreateDate',
    'GPSLatitude',
    'GPSLongitude',
    'Make',
    'Model',
    'ImageWidth',
    'ImageHeight',
    'ExifImageWidth',
    'ExifImageHeight',
  ],
  silentErrors: true,
};

/** Extracted EXIF data structure */
interface ExifData {
  takenAt: Date | null;
  gpsLat: number | null;
  gpsLng: number | null;
  cameraMake?: string;
  cameraModel?: string;
  width?: number;
  height?: number;
}

/**
 * Extract all relevant EXIF metadata from an image file.
 * Returns null values for missing data (common in screenshots, etc).
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    const exif = await exifr.parse(file, EXIF_OPTIONS);
    
    if (!exif) {
      return { takenAt: null, gpsLat: null, gpsLng: null };
    }
    
    // Extract date (prefer DateTimeOriginal, fall back to CreateDate)
    let takenAt: Date | null = null;
    if (exif.DateTimeOriginal instanceof Date) {
      takenAt = exif.DateTimeOriginal;
    } else if (exif.CreateDate instanceof Date) {
      takenAt = exif.CreateDate;
    }
    
    // Extract GPS coordinates
    const gpsLat = typeof exif.GPSLatitude === 'number' ? exif.GPSLatitude : null;
    const gpsLng = typeof exif.GPSLongitude === 'number' ? exif.GPSLongitude : null;
    
    // Extract camera info
    const cameraMake = typeof exif.Make === 'string' ? exif.Make : undefined;
    const cameraModel = typeof exif.Model === 'string' ? exif.Model : undefined;
    
    // Extract dimensions (try both regular and EXIF-specific fields)
    const width = exif.ExifImageWidth || exif.ImageWidth;
    const height = exif.ExifImageHeight || exif.ImageHeight;
    
    return {
      takenAt,
      gpsLat,
      gpsLng,
      cameraMake,
      cameraModel,
      width: typeof width === 'number' ? width : undefined,
      height: typeof height === 'number' ? height : undefined,
    };
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return { takenAt: null, gpsLat: null, gpsLng: null };
  }
}

/**
 * Process a single file into a Photo object with full metadata.
 * Converts the file to a data URL for persistence.
 */
export async function processPhotoFile(file: File, eventId: string): Promise<Photo> {
  const exifData = await extractExifData(file);
  
  // Convert to data URL for persistent storage
  const thumbnailUrl = await fileToDataUrl(file);
  
  // Build metadata object
  const metadata: PhotoMetadata = {
    fileSize: file.size,
    mimeType: file.type || 'image/jpeg',
    cameraMake: exifData.cameraMake,
    cameraModel: exifData.cameraModel,
    width: exifData.width,
    height: exifData.height,
  };
  
  return {
    id: generateId(),
    fileName: file.name,
    eventId,
    takenAt: exifData.takenAt,
    uploadedAt: new Date(),
    gpsLat: exifData.gpsLat,
    gpsLng: exifData.gpsLng,
    thumbnailUrl,
    metadata,
    file,
  };
}

/**
 * Process multiple files with progress callback.
 * Batches processing to prevent browser freezing.
 */
export async function processPhotoFiles(
  files: File[],
  eventId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<Photo[]> {
  const photos: Photo[] = [];
  let processed = 0;
  
  // Process in small batches for responsive UI
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(file => processPhotoFile(file, eventId))
    );
    photos.push(...batchResults);
    processed += batch.length;
    onProgress?.(processed, files.length);
  }
  
  return photos;
}
