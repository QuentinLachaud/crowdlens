/**
 * Core type definitions for the CrowdLens photo management app.
 * These types model the domain: photos, events, and their metadata.
 */

/** Represents a single photo with its metadata */
export interface Photo {
  /** Unique identifier for the photo */
  id: string;
  /** Original filename of the uploaded photo */
  fileName: string;
  /** ID of the event this photo belongs to */
  eventId: string;
  /** Date/time the photo was taken (from EXIF), null if unavailable */
  takenAt: Date | null;
  /** Date/time the photo was uploaded to the app */
  uploadedAt: Date;
  /** GPS latitude from EXIF metadata, null if unavailable */
  gpsLat: number | null;
  /** GPS longitude from EXIF metadata, null if unavailable */
  gpsLng: number | null;
  /** Object URL or data URL for displaying the thumbnail */
  thumbnailUrl: string;
  /** Original file reference for potential re-processing */
  file?: File;
}

/** Represents an event (folder) that groups photos together */
export interface Event {
  /** Unique identifier for the event */
  id: string;
  /** User-defined name for the event */
  name: string;
  /** Date/time the event was created */
  createdAt: Date;
}

/** Upload state for tracking file processing progress */
export type UploadState = 'idle' | 'selecting-event' | 'processing' | 'success' | 'error';

/** Represents a file being processed during upload */
export interface ProcessingFile {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
}

/** Grouped photos by location for map clustering */
export interface PhotoCluster {
  /** Center latitude of the cluster */
  lat: number;
  /** Center longitude of the cluster */
  lng: number;
  /** Photos in this cluster */
  photos: Photo[];
  /** Representative photo to show on the marker */
  representative: Photo;
}

/** Filter state for the photos view */
export interface PhotoFilters {
  searchQuery: string;
  selectedEventId: string | null;
  selectedYear: number | null;
}

/** Filter state for the map view */
export interface MapFilters {
  selectedEventIds: string[];
}

/** Active tab in the main app */
export type ActiveTab = 'photos' | 'map';
