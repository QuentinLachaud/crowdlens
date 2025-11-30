/**
 * Utility functions for working with photos and events.
 * These helpers keep component logic clean and testable.
 */

import { Photo, Event, PhotoCluster } from '@/types';

/** Generate a unique ID for new entities */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Format a date for display */
export function formatDate(date: Date | null, style: 'short' | 'long' = 'short'): string {
  if (!date) return 'Unknown date';
  
  const options: Intl.DateTimeFormatOptions = style === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return date.toLocaleDateString('en-US', options);
}

/** Get the date range string for a set of photos */
export function getDateRange(photos: Photo[]): string {
  const datesWithValue = photos
    .map(p => p.takenAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (datesWithValue.length === 0) {
    return 'No dates available';
  }
  
  const earliest = datesWithValue[0];
  const latest = datesWithValue[datesWithValue.length - 1];
  
  // Same day
  if (earliest.toDateString() === latest.toDateString()) {
    return formatDate(earliest);
  }
  
  // Same month
  if (earliest.getMonth() === latest.getMonth() && earliest.getFullYear() === latest.getFullYear()) {
    return `${earliest.getDate()} - ${latest.getDate()} ${earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  
  // Same year
  if (earliest.getFullYear() === latest.getFullYear()) {
    return `${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  
  return `${formatDate(earliest)} - ${formatDate(latest)}`;
}

/** Get a cover photo for an event (most recent by takenAt, or first uploaded) */
export function getCoverPhoto(photos: Photo[]): Photo | null {
  if (photos.length === 0) return null;
  
  // Sort by takenAt (nulls last), then by uploadedAt
  const sorted = [...photos].sort((a, b) => {
    if (a.takenAt && b.takenAt) {
      return b.takenAt.getTime() - a.takenAt.getTime();
    }
    if (a.takenAt) return -1;
    if (b.takenAt) return 1;
    return b.uploadedAt.getTime() - a.uploadedAt.getTime();
  });
  
  return sorted[0];
}

/** Group photos by year and month */
export function groupPhotosByTime(photos: Photo[]): Map<string, Photo[]> {
  const groups = new Map<string, Photo[]>();
  
  photos.forEach(photo => {
    const date = photo.takenAt || photo.uploadedAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(photo);
  });
  
  return groups;
}

/** Get unique years from photos */
export function getYearsFromPhotos(photos: Photo[]): number[] {
  const years = new Set<number>();
  photos.forEach(photo => {
    const date = photo.takenAt || photo.uploadedAt;
    years.add(date.getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
}

/** Cluster photos by location (within ~100m) */
export function clusterPhotosByLocation(photos: Photo[], threshold = 0.001): PhotoCluster[] {
  const photosWithLocation = photos.filter(p => p.gpsLat !== null && p.gpsLng !== null);
  const clusters: PhotoCluster[] = [];
  const processed = new Set<string>();
  
  photosWithLocation.forEach(photo => {
    if (processed.has(photo.id)) return;
    
    // Find all photos near this one
    const nearby = photosWithLocation.filter(p => {
      if (processed.has(p.id)) return false;
      const latDiff = Math.abs(p.gpsLat! - photo.gpsLat!);
      const lngDiff = Math.abs(p.gpsLng! - photo.gpsLng!);
      return latDiff < threshold && lngDiff < threshold;
    });
    
    nearby.forEach(p => processed.add(p.id));
    
    // Calculate cluster center
    const lat = nearby.reduce((sum, p) => sum + p.gpsLat!, 0) / nearby.length;
    const lng = nearby.reduce((sum, p) => sum + p.gpsLng!, 0) / nearby.length;
    
    // Get representative (most recent by takenAt)
    const representative = getCoverPhoto(nearby) || nearby[0];
    
    clusters.push({
      lat,
      lng,
      photos: nearby,
      representative,
    });
  });
  
  return clusters;
}

/** Check if a file is a valid image */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  return validTypes.includes(file.type.toLowerCase()) || 
         /\.(jpg|jpeg|png|heic|heif|webp)$/i.test(file.name);
}

/** Create an object URL for a file (for thumbnail display) */
export function createThumbnailUrl(file: File): string {
  return URL.createObjectURL(file);
}

/** Revoke an object URL to free memory */
export function revokeThumbnailUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
