/**
 * EventDetailView - Single event view with photo grid and zoom slider.
 * 
 * Features:
 * - Back button to return to events list
 * - Zoom slider (2-8 images per row)
 * - Photo grid with responsive sizing
 * - Event metadata display
 */

'use client';

import { useMemo } from 'react';
import { ArrowLeft, Calendar, MapPin, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { getDateRange, groupPhotosByTime } from '@/utils/helpers';
import PhotoModal from './PhotoModal';
import { useState } from 'react';
import { Photo } from '@/types';

export default function EventDetailView() {
  const { 
    selectedEventId, 
    setSelectedEventId, 
    events, 
    photos, 
    deleteEvent,
    eventDetailZoom,
    setEventDetailZoom,
  } = usePhotos();
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
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
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${event.name}" and all its photos?`)) {
      deleteEvent(selectedEventId);
      setSelectedEventId(null);
    }
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
            onClick={handleDelete}
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
              {groupPhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="
                    aspect-square rounded-xl overflow-hidden
                    bg-gray-100 dark:bg-gray-800
                    hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 
                    dark:hover:ring-offset-gray-900
                    transition-all duration-200
                    hover:scale-[1.02]
                  "
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
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
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
