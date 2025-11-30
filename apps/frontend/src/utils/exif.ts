/**
 * EXIF metadata extraction utilities.
 * Uses the exifr library to extract date and GPS data from photos.
 */

import exifr from 'exifr';
import { Photo } from '@/types';
import { generateId, createThumbnailUrl } from './helpers';

/** Options for exifr to extract only what we need */
const EXIF_OPTIONS = {
  // We only need these tags
  pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude'],
  // Don't fail on missing data
  silentErrors: true,
};

/** Extract EXIF metadata from a file */
export async function extractExifData(file: File): Promise<{
  takenAt: Date | null;
  gpsLat: number | null;
  gpsLng: number | null;
}> {
  try {
    const exif = await exifr.parse(file, EXIF_OPTIONS);
    
    if (!exif) {
      return { takenAt: null, gpsLat: null, gpsLng: null };
    }
    
    // Extract date - try DateTimeOriginal first, then CreateDate
    let takenAt: Date | null = null;
    if (exif.DateTimeOriginal instanceof Date) {
      takenAt = exif.DateTimeOriginal;
    } else if (exif.CreateDate instanceof Date) {
      takenAt = exif.CreateDate;
    }
    
    // Extract GPS coordinates
    const gpsLat = typeof exif.GPSLatitude === 'number' ? exif.GPSLatitude : null;
    const gpsLng = typeof exif.GPSLongitude === 'number' ? exif.GPSLongitude : null;
    
    return { takenAt, gpsLat, gpsLng };
  } catch (error) {
    console.warn('Failed to extract EXIF data:', error);
    return { takenAt: null, gpsLat: null, gpsLng: null };
  }
}

/** Process a file and create a Photo object */
export async function processPhotoFile(file: File, eventId: string): Promise<Photo> {
  const { takenAt, gpsLat, gpsLng } = await extractExifData(file);
  
  return {
    id: generateId(),
    fileName: file.name,
    eventId,
    takenAt,
    uploadedAt: new Date(),
    gpsLat,
    gpsLng,
    thumbnailUrl: createThumbnailUrl(file),
    file,
  };
}

/** Process multiple files in parallel */
export async function processPhotoFiles(
  files: File[],
  eventId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<Photo[]> {
  const photos: Photo[] = [];
  let processed = 0;
  
  // Process in batches to avoid overwhelming the browser
  const BATCH_SIZE = 5;
  
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
