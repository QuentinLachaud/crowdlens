/**
 * Core type definitions for CrowdLens.
 * 
 * Domain model overview:
 * - Photo: Image with metadata (location, timestamp, file size)
 * - Event: Collection of photos with properties (dates, location, type)
 * - PhotoCluster: Grouped photos for map visualization
 */

/** Event categories for organization and filtering */
export type EventType =
  | 'concert'
  | 'festival'
  | 'graduation'
  | 'wedding'
  | 'outing'
  | 'vacation'
  | 'tourist-attraction'
  | 'school-trip'
  | 'get-together'
  | 'birthday'
  | 'anniversary'
  | 'corporate'
  | 'sports'
  | 'religious'
  | 'charity'
  | 'exhibition'
  | 'conference'
  | 'other';

/** Human-readable labels for event types */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  'concert': 'Concert',
  'festival': 'Festival',
  'graduation': 'Graduation',
  'wedding': 'Wedding',
  'outing': 'Outing',
  'vacation': 'Vacation',
  'tourist-attraction': 'Tourist Attraction',
  'school-trip': 'School Trip',
  'get-together': 'Get-together',
  'birthday': 'Birthday',
  'anniversary': 'Anniversary',
  'corporate': 'Corporate Event',
  'sports': 'Sports Event',
  'religious': 'Religious Event',
  'charity': 'Charity Event',
  'exhibition': 'Exhibition',
  'conference': 'Conference',
  'other': 'Other',
};

/**
 * Photo metadata structure.
 * Contains all extracted EXIF data plus computed properties.
 */
export interface PhotoMetadata {
  /** File size in bytes */
  fileSize: number;
  /** MIME type (e.g., 'image/jpeg') */
  mimeType: string;
  /** Original camera make (from EXIF) */
  cameraMake?: string;
  /** Original camera model (from EXIF) */
  cameraModel?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
}

/**
 * Represents a single photo with all metadata.
 * Central entity in the data model.
 */
export interface Photo {
  /** Unique identifier */
  id: string;
  /** Original filename */
  fileName: string;
  /** Parent event ID */
  eventId: string;
  /** When the photo was taken (EXIF DateTimeOriginal) */
  takenAt: Date | null;
  /** When the photo was uploaded to the app */
  uploadedAt: Date;
  /** GPS latitude from EXIF */
  gpsLat: number | null;
  /** GPS longitude from EXIF */
  gpsLng: number | null;
  /** Display URL (blob URL or data URL) */
  thumbnailUrl: string;
  /** Extended metadata */
  metadata: PhotoMetadata;
  /** Original file (only in memory, not persisted) */
  file?: File;
}

/**
 * Represents an event (photo collection).
 * Contains user-defined properties and computed stats.
 */
export interface Event {
  /** Unique identifier */
  id: string;
  /** User-defined event name */
  name: string;
  /** Event description (optional) */
  description?: string;
  /** Event type category */
  eventType: EventType;
  /** Event location name (address or place) */
  locationName?: string;
  /** GPS latitude of event location */
  locationLat?: number;
  /** GPS longitude of event location */
  locationLng?: number;
  /** Is this a multi-day event? */
  isMultiDay: boolean;
  /** Event start date */
  startDate: Date | null;
  /** Event end date (for multi-day events) */
  endDate: Date | null;
  /** When the event was created in the app */
  createdAt: Date;
}

/** Upload state machine states */
export type UploadState = 'idle' | 'selecting-event' | 'processing' | 'success' | 'error';

/** File processing status during upload */
export interface ProcessingFile {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
}

/**
 * Clustered photos for map display.
 * Groups nearby photos to prevent marker overlap.
 */
export interface PhotoCluster {
  /** Cluster center latitude */
  lat: number;
  /** Cluster center longitude */
  lng: number;
  /** Photos in this cluster */
  photos: Photo[];
  /** Representative photo (shown in marker) */
  representative: Photo;
}

/** Photo view filter state */
export interface PhotoFilters {
  searchQuery: string;
  selectedEventId: string | null;
  selectedYear: number | null;
}

/** Map view filter state */
export interface MapFilters {
  selectedEventIds: string[];
}

/** Main navigation tab */
export type ActiveTab = 'photos' | 'map';

/**
 * User's current location.
 * Retrieved via geolocation API or IP-based fallback.
 */
export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'gps' | 'ip' | 'default';
}
