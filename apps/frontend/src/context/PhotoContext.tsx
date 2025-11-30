/**
 * PhotoContext - Global state management for photos and events.
 * 
 * This context provides:
 * - Photos and events storage (in-memory for MVP)
 * - Methods to add/remove photos and events
 * - Filter state for both photos and map views
 * 
 * Designed to be easily replaceable with API calls in the future.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Photo, Event, PhotoFilters, MapFilters, UploadState } from '@/types';
import { generateId } from '@/utils/helpers';
import { processPhotoFiles } from '@/utils/exif';
import { isValidImageFile } from '@/utils/helpers';

interface PhotoContextValue {
  // Data
  photos: Photo[];
  events: Event[];
  
  // Upload state
  uploadState: UploadState;
  uploadProgress: { processed: number; total: number };
  pendingFiles: File[];
  
  // Filters
  photoFilters: PhotoFilters;
  mapFilters: MapFilters;
  
  // Selected states
  selectedEventId: string | null;
  
  // Actions
  setPendingFiles: (files: File[]) => void;
  createEvent: (name: string) => Event;
  uploadPhotosToEvent: (eventId: string) => Promise<void>;
  cancelUpload: () => void;
  setPhotoFilters: (filters: Partial<PhotoFilters>) => void;
  setMapFilters: (filters: Partial<MapFilters>) => void;
  setSelectedEventId: (id: string | null) => void;
  getPhotosForEvent: (eventId: string) => Photo[];
  getPhotosWithLocation: () => Photo[];
  deletePhoto: (photoId: string) => void;
  deleteEvent: (eventId: string) => void;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: ReactNode }) {
  // Core data state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, total: 0 });
  const [pendingFiles, setPendingFilesState] = useState<File[]>([]);
  
  // Filter state
  const [photoFilters, setPhotoFiltersState] = useState<PhotoFilters>({
    searchQuery: '',
    selectedEventId: null,
    selectedYear: null,
  });
  const [mapFilters, setMapFiltersState] = useState<MapFilters>({
    selectedEventIds: [],
  });
  
  // Selection state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Set pending files and show event selector
  const setPendingFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(isValidImageFile);
    if (validFiles.length === 0) {
      alert('Please select valid image files (JPEG, PNG, HEIC, WebP)');
      return;
    }
    setPendingFilesState(validFiles);
    setUploadState('selecting-event');
  }, []);
  
  // Create a new event
  const createEvent = useCallback((name: string): Event => {
    const event: Event = {
      id: generateId(),
      name: name.trim() || 'Untitled Event',
      createdAt: new Date(),
    };
    setEvents(prev => [...prev, event]);
    return event;
  }, []);
  
  // Upload photos to an event
  const uploadPhotosToEvent = useCallback(async (eventId: string) => {
    if (pendingFiles.length === 0) return;
    
    setUploadState('processing');
    setUploadProgress({ processed: 0, total: pendingFiles.length });
    
    try {
      const newPhotos = await processPhotoFiles(
        pendingFiles,
        eventId,
        (processed, total) => setUploadProgress({ processed, total })
      );
      
      setPhotos(prev => [...prev, ...newPhotos]);
      setUploadState('success');
      
      // Reset after showing success briefly
      setTimeout(() => {
        setUploadState('idle');
        setPendingFilesState([]);
        setUploadProgress({ processed: 0, total: 0 });
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadState('error');
      setTimeout(() => {
        setUploadState('idle');
        setPendingFilesState([]);
      }, 3000);
    }
  }, [pendingFiles]);
  
  // Cancel upload process
  const cancelUpload = useCallback(() => {
    setPendingFilesState([]);
    setUploadState('idle');
    setUploadProgress({ processed: 0, total: 0 });
  }, []);
  
  // Update photo filters
  const setPhotoFilters = useCallback((filters: Partial<PhotoFilters>) => {
    setPhotoFiltersState(prev => ({ ...prev, ...filters }));
  }, []);
  
  // Update map filters
  const setMapFilters = useCallback((filters: Partial<MapFilters>) => {
    setMapFiltersState(prev => ({ ...prev, ...filters }));
  }, []);
  
  // Get photos for a specific event
  const getPhotosForEvent = useCallback((eventId: string) => {
    return photos.filter(p => p.eventId === eventId);
  }, [photos]);
  
  // Get photos with location data
  const getPhotosWithLocation = useCallback(() => {
    return photos.filter(p => p.gpsLat !== null && p.gpsLng !== null);
  }, [photos]);
  
  // Delete a photo
  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);
  
  // Delete an event and its photos
  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setPhotos(prev => prev.filter(p => p.eventId !== eventId));
  }, []);
  
  const value: PhotoContextValue = {
    photos,
    events,
    uploadState,
    uploadProgress,
    pendingFiles,
    photoFilters,
    mapFilters,
    selectedEventId,
    setPendingFiles,
    createEvent,
    uploadPhotosToEvent,
    cancelUpload,
    setPhotoFilters,
    setMapFilters,
    setSelectedEventId,
    getPhotosForEvent,
    getPhotosWithLocation,
    deletePhoto,
    deleteEvent,
  };
  
  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
}

/** Hook to access the photo context */
export function usePhotos() {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
}
