/**
 * EventCardEnhanced - Event card with photo cycling, favorites, and action buttons.
 * 
 * Features:
 * - Favorite star (gold, satisfying click)
 * - Photo cycling with left/right arrows
 * - Photo count highlight when cycling unavailable
 * - Edit and Add Photos buttons
 */

'use client';

import { useState, useRef } from 'react';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  ImageIcon, 
  Plus, 
  Pencil 
} from 'lucide-react';
import { Event, Photo, EVENT_TYPE_LABELS } from '@/types';
import { formatDate } from '@/utils/helpers';
import { usePhotos } from '@/context/PhotoContext';

interface EventCardEnhancedProps {
  event: Event;
  photos: Photo[];
  coverPhoto: Photo | null;
  photoCount: number;
  dateRange: string;
  onClick: () => void;
}

/** Generate static map URL for event location */
function getStaticMapUrl(lat: number, lng: number, zoom = 12): string {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export default function EventCardEnhanced({ 
  event, 
  photos, 
  coverPhoto, 
  photoCount, 
  dateRange, 
  onClick 
}: EventCardEnhancedProps) {
  const { 
    toggleFavorite, 
    setEditingEventId, 
    setShowEditEventModal,
    uploadFilesToEvent,
  } = usePhotos();
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoCountHighlight, setShowPhotoCountHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasLocation = event.locationLat !== undefined && event.locationLng !== undefined;
  const displayDate = event.startDate 
    ? formatDate(event.startDate) + (event.isMultiDay && event.endDate ? ` - ${formatDate(event.endDate)}` : '')
    : dateRange;
  
  // Get current photo to display
  const displayPhoto = photos.length > 0 ? photos[currentPhotoIndex] : null;
  
  // Handle photo cycling
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length <= 1) {
      highlightPhotoCount();
      return;
    }
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };
  
  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length <= 1) {
      highlightPhotoCount();
      return;
    }
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };
  
  const highlightPhotoCount = () => {
    setShowPhotoCountHighlight(true);
    setTimeout(() => setShowPhotoCountHighlight(false), 800);
  };
  
  // Handle favorite toggle
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(event.id);
  };
  
  // Handle edit click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    setShowEditEventModal(true);
  };
  
  // Handle add photos click
  const handleAddPhotosClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };
  
  // Handle file selection - directly upload to this event
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFilesToEvent(files, event.id);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="
        group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden
        shadow-sm hover:shadow-xl transition-all duration-300 ease-out
        hover:-translate-y-1 cursor-pointer
        border border-gray-100 dark:border-gray-700
      "
    >
      {/* Hidden file input for adding photos */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {/* Cover image / Map preview */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {displayPhoto ? (
          <img
            src={displayPhoto.thumbnailUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
          />
        ) : hasLocation ? (
          <div className="w-full h-full relative">
            <img
              src={getStaticMapUrl(event.locationLat!, event.locationLng!)}
              alt="Event location"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/40 via-transparent to-secondary-900/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-primary-500 drop-shadow-lg">
                <MapPin className="w-8 h-8" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        
        {/* Photo cycling arrows */}
        <button
          onClick={handlePrevPhoto}
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm
            flex items-center justify-center
            text-white opacity-0 group-hover:opacity-100
            hover:bg-black/60 transition-all duration-200
            hover:scale-110 active:scale-95
          "
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleNextPhoto}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm
            flex items-center justify-center
            text-white opacity-0 group-hover:opacity-100
            hover:bg-black/60 transition-all duration-200
            hover:scale-110 active:scale-95
          "
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.slice(0, 5).map((_, idx) => (
              <div 
                key={idx}
                className={`
                  w-1.5 h-1.5 rounded-full transition-all duration-200
                  ${idx === currentPhotoIndex ? 'bg-white w-3' : 'bg-white/50'}
                `}
              />
            ))}
            {photos.length > 5 && (
              <span className="text-white text-xs ml-1">+{photos.length - 5}</span>
            )}
          </div>
        )}
        
        {/* Favorite star button - top right */}
        <button
          onClick={handleFavoriteClick}
          className={`
            absolute top-3 right-3 z-10
            w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            hover:scale-125 active:scale-90
            ${event.isFavorite 
              ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/50' 
              : 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60'
            }
          `}
        >
          <Star 
            className={`w-5 h-5 transition-transform duration-300 ${event.isFavorite ? 'fill-current animate-pop-in' : ''}`}
          />
        </button>
        
        {/* Photo count badge */}
        <div 
          className={`
            absolute top-3 left-3 
            bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full
            transition-all duration-300
            ${showPhotoCountHighlight 
              ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent bg-amber-500/80 scale-110' 
              : ''
            }
          `}
        >
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </div>
        
        {/* Event type badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
          {EVENT_TYPE_LABELS[event.eventType]}
        </div>
      </div>
      
      {/* Info section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {event.name}
        </h3>
        
        <div className="flex flex-col gap-1 mb-4">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="truncate">{displayDate}</span>
          </div>
          
          {/* Location */}
          {event.locationName && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.locationName}</span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          {/* Edit button */}
          <button
            onClick={handleEditClick}
            className="
              p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700
              text-gray-600 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-600
              hover:text-gray-800 dark:hover:text-gray-200
              transition-all duration-200
              hover:scale-110 active:scale-95
            "
            title="Edit event"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          {/* Add photos button */}
          <button
            onClick={handleAddPhotosClick}
            className="
              p-2.5 rounded-xl 
              bg-gradient-to-r from-primary-500 to-primary-600
              text-white
              hover:from-primary-600 hover:to-primary-700
              shadow-lg shadow-primary-500/25
              hover:shadow-xl hover:shadow-primary-500/35
              transition-all duration-200
              hover:scale-110 active:scale-95
            "
            title="Add photos"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
