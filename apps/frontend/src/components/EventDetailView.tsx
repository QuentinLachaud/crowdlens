/**
 * EventDetailView - Single event view with photo grid and zoom slider.
 * 
 * Features:
 * - Back button to return to events list
 * - Zoom slider (2-8 images per row)
 * - Photo grid with responsive sizing
 * - Multi-select photos with delete
 * - Floating upload button
 * - Event metadata display
 */

'use client';

import { useMemo, useState, useRef, ChangeEvent } from 'react';
import { ArrowLeft, Calendar, MapPin, Trash2, ZoomIn, ZoomOut, CheckSquare, Square, X, Plus, UserSearch } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { getDateRange, groupPhotosByTime } from '@/utils/helpers';
import PhotoModal from './PhotoModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import FindYourselfModal from './FindYourselfModal';
import { Photo } from '@/types';

export default function EventDetailView() {
  const { 
    selectedEventId, 
    setSelectedEventId, 
    events, 
    photos, 
    deleteEvent,
    deletePhoto,
    eventDetailZoom,
    setEventDetailZoom,
    setPendingFiles,
  } = usePhotos();
  
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  
  // Derive selectedPhoto from photos array to get fresh data after updates
  const selectedPhoto = useMemo(() => {
    if (!selectedPhotoId) return null;
    return photos.find(p => p.id === selectedPhotoId) ?? null;
  }, [photos, selectedPhotoId]);
  
  // Delete confirmation modal state
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [showDeletePhotosModal, setShowDeletePhotosModal] = useState(false);
  
  // Find yourself modal state
  const [showFindYourselfModal, setShowFindYourselfModal] = useState(false);
  
  const event = useMemo(() => {
    return events.find(e => e.id === selectedEventId);
  }, [events, selectedEventId]);
  
  const eventPhotos = useMemo(() => {
    return photos.filter(p => p.eventId === selectedEventId);
  }, [photos, selectedEventId]);
  
  const dateRange = useMemo(() => {
    return getDateRange(eventPhotos);
  }, [eventPhotos]);
  
  const photosWithLocation = useMemo(() => {
    return eventPhotos.filter(p => p.gpsLat !== null && p.gpsLng !== null).length;
  }, [eventPhotos]);
  
  // Group photos by month
  const groupedPhotos = useMemo(() => {
    const groups = groupPhotosByTime(eventPhotos);
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [eventPhotos]);
  
  if (!event || !selectedEventId) return null;
  
  const handleDeleteEvent = () => {
    setShowDeleteEventModal(true);
  };
  
  const confirmDeleteEvent = () => {
    deleteEvent(selectedEventId);
    setSelectedEventId(null);
  };
  
  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };
  
  // Exit multi-select mode
  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedPhotoIds(new Set());
  };
  
  // Delete selected photos
  const deleteSelectedPhotos = () => {
    setShowDeletePhotosModal(true);
  };
  
  const confirmDeletePhotos = () => {
    selectedPhotoIds.forEach(id => deletePhoto(id));
    exitMultiSelectMode();
  };
  
  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles(files);
    }
    e.target.value = '';
  };
  
  const formatGroupKey = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Calculate grid columns based on zoom
  const getGridCols = () => {
    switch (eventDetailZoom) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
      case 5: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      case 6: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
      case 7: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7';
      case 8: return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8';
      default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    }
  };
  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setSelectedEventId(null)}
            className="
              p-2 rounded-lg text-gray-500 hover:text-gray-700 
              dark:text-gray-400 dark:hover:text-gray-200 
              hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-colors mt-1
            "
            aria-label="Back to events"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{dateRange}</span>
              </div>
              <span>•</span>
              <span>{eventPhotos.length} photo{eventPhotos.length !== 1 ? 's' : ''}</span>
              {photosWithLocation > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{photosWithLocation} with location</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Multi-select toggle */}
          <button
            onClick={() => isMultiSelectMode ? exitMultiSelectMode() : setIsMultiSelectMode(true)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isMultiSelectMode 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {isMultiSelectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span>Select</span>
          </button>
          
          {/* Delete selected photos button (shown in multi-select mode) */}
          {isMultiSelectMode && selectedPhotoIds.size > 0 && (
            <button
              onClick={deleteSelectedPhotos}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                hover:bg-red-200 dark:hover:bg-red-900/50
                transition-all duration-200
              "
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete {selectedPhotoIds.size}</span>
            </button>
          )}
          
          {/* Find Yourself button */}
          <button
            onClick={() => setShowFindYourselfModal(true)}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-gradient-to-r from-violet-500 to-purple-600
              text-white
              hover:from-violet-600 hover:to-purple-700
              shadow-lg shadow-violet-500/25
              hover:shadow-xl hover:shadow-violet-500/35
              transition-all duration-200
            "
          >
            <UserSearch className="w-4 h-4" />
            <span>Find yourself</span>
          </button>
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <ZoomOut className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min={2}
              max={8}
              value={eventDetailZoom}
              onChange={(e) => setEventDetailZoom(parseInt(e.target.value))}
              className="
                w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-primary-500/30
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-125
              "
            />
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </div>
          
          <button
            onClick={handleDeleteEvent}
            className="
              p-2 rounded-lg text-red-500 hover:text-red-600 
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors
            "
            aria-label="Delete event"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Photo groups by month */}
      <div className="space-y-8">
        {groupedPhotos.map(([key, groupPhotos]) => (
          <div key={key}>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {formatGroupKey(key)}
            </h3>
            <div className={`grid gap-3 ${getGridCols()}`}>
              {groupPhotos.map(photo => {
                const isSelected = selectedPhotoIds.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() => isMultiSelectMode ? togglePhotoSelection(photo.id) : setSelectedPhotoId(photo.id)}
                    className={`
                      relative aspect-square rounded-xl overflow-hidden
                      bg-gray-100 dark:bg-gray-800
                      transition-all duration-200
                      hover:scale-[1.02]
                      ${isSelected 
                        ? 'ring-4 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' 
                        : 'hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 dark:hover:ring-offset-gray-900'
                      }
                    `}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Selection checkbox overlay */}
                    {isMultiSelectMode && (
                      <div className={`
                        absolute top-2 left-2 w-6 h-6 rounded-full
                        flex items-center justify-center
                        transition-all duration-200
                        ${isSelected 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-black/40 text-white border-2 border-white'
                        }
                      `}>
                        {isSelected && <CheckSquare className="w-4 h-4" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {eventPhotos.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p>No photos in this event yet.</p>
            <p className="text-sm mt-2">Upload photos to see them here.</p>
          </div>
        )}
      </div>
      
      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto}
          onClose={() => setSelectedPhotoId(null)}
        />
      )}
      
      {/* Delete Event Confirmation */}
      <ConfirmDeleteModal
        isOpen={showDeleteEventModal}
        onClose={() => setShowDeleteEventModal(false)}
        onConfirm={confirmDeleteEvent}
        itemType="event"
        itemName={event.name}
        message={`Are you sure you want to delete "${event.name}" and all its ${eventPhotos.length} photos? This cannot be undone.`}
      />
      
      {/* Delete Photos Confirmation */}
      <ConfirmDeleteModal
        isOpen={showDeletePhotosModal}
        onClose={() => setShowDeletePhotosModal(false)}
        onConfirm={confirmDeletePhotos}
        itemType="photos"
        title={`Delete ${selectedPhotoIds.size} photo${selectedPhotoIds.size !== 1 ? 's' : ''}?`}
        message={`Are you sure you want to delete ${selectedPhotoIds.size} selected photo${selectedPhotoIds.size !== 1 ? 's' : ''}? This cannot be undone.`}
      />
      
      {/* Find Yourself Modal */}
      {event && (
        <FindYourselfModal
          isOpen={showFindYourselfModal}
          onClose={() => setShowFindYourselfModal(false)}
          eventId={event.id}
          eventName={event.name}
        />
      )}
      
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Floating Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="
          fixed bottom-8 right-8 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-r from-primary-500 to-primary-600
          hover:from-primary-600 hover:to-primary-700
          text-white shadow-xl shadow-primary-500/30
          hover:shadow-2xl hover:shadow-primary-500/40
          hover:scale-110 active:scale-95
          transition-all duration-300 ease-out
          flex items-center justify-center
        "
        title="Add photos to event"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
