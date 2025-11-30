/**
 * PhotoContext - Global state management for photos and events.
 * 
 * Features:
 * - Photos and events storage with localStorage persistence
 * - CRUD operations for photos and events
 * - Filter state for both photos and map views
 * - Upload workflow management
 * 
 * Persistence: Data auto-saves to localStorage on every mutation.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Photo, Event, PhotoFilters, MapFilters, EventFilters, UploadState, EventType } from '@/types';
import { generateId } from '@/utils/helpers';
import { processPhotoFiles } from '@/utils/exif';
import { isValidImageFile } from '@/utils/helpers';
import { savePhotos, loadPhotos, saveEvents, loadEvents } from '@/services/storage';

/** Event creation parameters */
export interface CreateEventParams {
  name: string;
  description?: string;
  eventType: EventType;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  isMultiDay: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

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
  eventFilters: EventFilters;
  
  // Selected states
  selectedEventId: string | null;
  
  // View settings
  eventDetailZoom: number; // 2-8 images per row
  setEventDetailZoom: (zoom: number) => void;
  
  // Modal state
  showCreateEventModal: boolean;
  setShowCreateEventModal: (show: boolean) => void;
  showEditEventModal: boolean;
  setShowEditEventModal: (show: boolean) => void;
  editingEventId: string | null;
  setEditingEventId: (id: string | null) => void;
  
  // Actions
  setPendingFiles: (files: File[]) => void;
  createEvent: (params: CreateEventParams) => Event;
  updateEvent: (eventId: string, params: Partial<CreateEventParams>) => void;
  uploadPhotosToEvent: (eventId: string) => Promise<void>;
  cancelUpload: () => void;
  setPhotoFilters: (filters: Partial<PhotoFilters>) => void;
  setMapFilters: (filters: Partial<MapFilters>) => void;
  setEventFilters: (filters: Partial<EventFilters>) => void;
  setSelectedEventId: (id: string | null) => void;
  getPhotosForEvent: (eventId: string) => Photo[];
  getPhotosWithLocation: () => Photo[];
  toggleFavorite: (eventId: string) => void;
  togglePhotoFavorite: (photoId: string) => void;
  deletePhoto: (photoId: string) => void;
  deleteEvent: (eventId: string) => void;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: ReactNode }) {
  // Core data state - initialized from localStorage
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, total: 0 });
  const [pendingFiles, setPendingFilesState] = useState<File[]>([]);
  
  // Filter state
  const [photoFilters, setPhotoFiltersState] = useState<PhotoFilters>({
    searchQuery: '',
    selectedEventId: null,
    selectedYear: null,
    showFavoritesOnly: false,
    selectedCountry: null,
    selectedCity: null,
  });
  const [mapFilters, setMapFiltersState] = useState<MapFilters>({
    selectedEventIds: [],
  });
  const [eventFilters, setEventFiltersState] = useState<EventFilters>({
    showFavoritesOnly: false,
    sortBy: 'startDate',
    sortOrder: 'desc',
    selectedLocations: [],
  });
  
  // View settings
  const [eventDetailZoom, setEventDetailZoom] = useState(4); // Default 4 images per row
  
  // Selection and modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Load data from localStorage on mount
  useEffect(() => {
    const storedPhotos = loadPhotos();
    const storedEvents = loadEvents();
    setPhotos(storedPhotos);
    setEvents(storedEvents);
    setIsHydrated(true);
  }, []);
  
  // Persist photos to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      savePhotos(photos);
    }
  }, [photos, isHydrated]);
  
  // Persist events to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      saveEvents(events);
    }
  }, [events, isHydrated]);
  
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
  
  // Create a new event with full properties
  const createEvent = useCallback((params: CreateEventParams): Event => {
    const event: Event = {
      id: generateId(),
      name: params.name.trim() || 'Untitled Event',
      description: params.description,
      eventType: params.eventType,
      locationName: params.locationName,
      locationLat: params.locationLat,
      locationLng: params.locationLng,
      isMultiDay: params.isMultiDay,
      startDate: params.startDate,
      endDate: params.endDate,
      createdAt: new Date(),
      isFavorite: false,
    };
    setEvents(prev => [...prev, event]);
    return event;
  }, []);
  
  // Update an existing event
  const updateEvent = useCallback((eventId: string, params: Partial<CreateEventParams>) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        ...(params.name !== undefined && { name: params.name.trim() || e.name }),
        ...(params.description !== undefined && { description: params.description }),
        ...(params.eventType !== undefined && { eventType: params.eventType }),
        ...(params.locationName !== undefined && { locationName: params.locationName }),
        ...(params.locationLat !== undefined && { locationLat: params.locationLat }),
        ...(params.locationLng !== undefined && { locationLng: params.locationLng }),
        ...(params.isMultiDay !== undefined && { isMultiDay: params.isMultiDay }),
        ...(params.startDate !== undefined && { startDate: params.startDate }),
        ...(params.endDate !== undefined && { endDate: params.endDate }),
      };
    }));
  }, []);
  
  // Toggle event favorite status
  const toggleFavorite = useCallback((eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, isFavorite: !e.isFavorite } : e
    ));
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
      
      // Auto-infer event location from photos if event doesn't have location
      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e;
        // Skip if event already has location
        if (e.locationLat !== undefined && e.locationLng !== undefined) return e;
        
        // Find photos with GPS coordinates
        const photosWithGps = newPhotos.filter(p => p.gpsLat !== null && p.gpsLng !== null);
        if (photosWithGps.length === 0) return e;
        
        // Calculate the most common location (centroid of all GPS points)
        const avgLat = photosWithGps.reduce((sum, p) => sum + (p.gpsLat || 0), 0) / photosWithGps.length;
        const avgLng = photosWithGps.reduce((sum, p) => sum + (p.gpsLng || 0), 0) / photosWithGps.length;
        
        // Reverse geocode to get location name (fire-and-forget)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${avgLat}&lon=${avgLng}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              const parts = data.display_name.split(', ');
              const locationName = parts.slice(0, 2).join(', ');
              // Update event with location name
              setEvents(prev2 => prev2.map(e2 => 
                e2.id === eventId ? { ...e2, locationName } : e2
              ));
            }
          })
          .catch(() => {/* Ignore reverse geocode errors */});
        
        return { ...e, locationLat: avgLat, locationLng: avgLng };
      }));
      
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
  
  // Update event filters
  const setEventFilters = useCallback((filters: Partial<EventFilters>) => {
    setEventFiltersState(prev => ({ ...prev, ...filters }));
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
  
  // Toggle photo favorite status
  const togglePhotoFavorite = useCallback((photoId: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
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
    eventFilters,
    selectedEventId,
    eventDetailZoom,
    setEventDetailZoom,
    showCreateEventModal,
    setShowCreateEventModal,
    showEditEventModal,
    setShowEditEventModal,
    editingEventId,
    setEditingEventId,
    setPendingFiles,
    createEvent,
    updateEvent,
    uploadPhotosToEvent,
    cancelUpload,
    setPhotoFilters,
    setMapFilters,
    setEventFilters,
    setSelectedEventId,
    getPhotosForEvent,
    getPhotosWithLocation,
    toggleFavorite,
    togglePhotoFavorite,
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
