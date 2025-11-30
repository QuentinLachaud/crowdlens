/**
 * LocalStorage persistence service.
 * 
 * Handles saving and loading app data to localStorage for persistence
 * across page reloads. Uses a versioned schema for safe migrations.
 * 
 * Key design decisions:
 * - Photos store metadata only (file blobs converted to base64 data URLs)
 * - Events stored with full properties including location
 * - Automatic cleanup of orphaned data on load
 */

import { Photo, Event, PhotoMetadata } from '@/types';

/** Storage version for schema migrations */
const STORAGE_VERSION = 1;

/** LocalStorage keys */
const KEYS = {
  VERSION: 'crowdlens_version',
  PHOTOS: 'crowdlens_photos',
  EVENTS: 'crowdlens_events',
} as const;

/** Serializable photo data (without File object) */
interface StoredPhoto {
  id: string;
  fileName: string;
  eventId: string;
  takenAt: string | null;
  uploadedAt: string;
  gpsLat: number | null;
  gpsLng: number | null;
  thumbnailUrl: string;
  metadata: PhotoMetadata;
}

/** Serializable event data */
interface StoredEvent {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  isMultiDay: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isFavorite: boolean;
}

/**
 * Converts a Photo to storable format.
 * Dates become ISO strings, File objects are dropped.
 */
function serializePhoto(photo: Photo): StoredPhoto {
  return {
    id: photo.id,
    fileName: photo.fileName,
    eventId: photo.eventId,
    takenAt: photo.takenAt?.toISOString() ?? null,
    uploadedAt: photo.uploadedAt.toISOString(),
    gpsLat: photo.gpsLat,
    gpsLng: photo.gpsLng,
    thumbnailUrl: photo.thumbnailUrl,
    metadata: photo.metadata,
  };
}

/**
 * Converts stored data back to Photo.
 * ISO strings become Date objects.
 */
function deserializePhoto(stored: StoredPhoto): Photo {
  return {
    id: stored.id,
    fileName: stored.fileName,
    eventId: stored.eventId,
    takenAt: stored.takenAt ? new Date(stored.takenAt) : null,
    uploadedAt: new Date(stored.uploadedAt),
    gpsLat: stored.gpsLat,
    gpsLng: stored.gpsLng,
    thumbnailUrl: stored.thumbnailUrl,
    metadata: stored.metadata || { fileSize: 0, mimeType: 'image/jpeg' },
  };
}

/**
 * Converts an Event to storable format.
 */
function serializeEvent(event: Event): StoredEvent {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    eventType: event.eventType,
    locationName: event.locationName,
    locationLat: event.locationLat,
    locationLng: event.locationLng,
    isMultiDay: event.isMultiDay,
    startDate: event.startDate?.toISOString() ?? null,
    endDate: event.endDate?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    isFavorite: event.isFavorite,
  };
}

/**
 * Converts stored data back to Event.
 */
function deserializeEvent(stored: StoredEvent): Event {
  return {
    id: stored.id,
    name: stored.name,
    description: stored.description,
    eventType: stored.eventType as Event['eventType'],
    locationName: stored.locationName,
    locationLat: stored.locationLat,
    locationLng: stored.locationLng,
    isMultiDay: stored.isMultiDay ?? false,
    startDate: stored.startDate ? new Date(stored.startDate) : null,
    endDate: stored.endDate ? new Date(stored.endDate) : null,
    createdAt: new Date(stored.createdAt),
    isFavorite: stored.isFavorite ?? false,
  };
}

/**
 * Save photos to localStorage.
 * Call this after any photo state change.
 */
export function savePhotos(photos: Photo[]): void {
  try {
    const serialized = photos.map(serializePhoto);
    localStorage.setItem(KEYS.PHOTOS, JSON.stringify(serialized));
    localStorage.setItem(KEYS.VERSION, String(STORAGE_VERSION));
  } catch (error) {
    console.error('Failed to save photos to localStorage:', error);
  }
}

/**
 * Load photos from localStorage.
 * Returns empty array if no data or on error.
 */
export function loadPhotos(): Photo[] {
  try {
    const stored = localStorage.getItem(KEYS.PHOTOS);
    if (!stored) return [];
    
    const parsed: StoredPhoto[] = JSON.parse(stored);
    return parsed.map(deserializePhoto);
  } catch (error) {
    console.error('Failed to load photos from localStorage:', error);
    return [];
  }
}

/**
 * Save events to localStorage.
 */
export function saveEvents(events: Event[]): void {
  try {
    const serialized = events.map(serializeEvent);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(serialized));
    localStorage.setItem(KEYS.VERSION, String(STORAGE_VERSION));
  } catch (error) {
    console.error('Failed to save events to localStorage:', error);
  }
}

/**
 * Load events from localStorage.
 */
export function loadEvents(): Event[] {
  try {
    const stored = localStorage.getItem(KEYS.EVENTS);
    if (!stored) return [];
    
    const parsed: StoredEvent[] = JSON.parse(stored);
    return parsed.map(deserializeEvent);
  } catch (error) {
    console.error('Failed to load events from localStorage:', error);
    return [];
  }
}

/**
 * Clear all stored data.
 * Useful for debugging or user-initiated reset.
 */
export function clearStorage(): void {
  localStorage.removeItem(KEYS.VERSION);
  localStorage.removeItem(KEYS.PHOTOS);
  localStorage.removeItem(KEYS.EVENTS);
}

/**
 * Convert a File to a base64 data URL for storage.
 * This allows images to persist across page reloads.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate approximate storage usage in bytes.
 * Helps monitor localStorage limits (~5MB typical).
 */
export function getStorageUsage(): { used: number; available: number } {
  let used = 0;
  for (const key of Object.values(KEYS)) {
    const item = localStorage.getItem(key);
    if (item) used += item.length * 2; // UTF-16 = 2 bytes per char
  }
  
  return {
    used,
    available: 5 * 1024 * 1024, // 5MB typical limit
  };
}
