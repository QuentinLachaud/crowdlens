/**
 * EventCard - Event preview card with cover image or map preview.
 * 
 * Features:
 * - Cover photo display when available
 * - Static map preview when no photos (uses event location)
 * - Event info: name, date, city, photo count
 * - Hover animations
 */

'use client';

import { Calendar, MapPin, ImageIcon } from 'lucide-react';
import { Event, Photo, EVENT_TYPE_LABELS } from '@/types';
import { formatDate } from '@/utils/helpers';

interface EventCardProps {
  event: Event;
  coverPhoto: Photo | null;
  photoCount: number;
  dateRange: string;
  onClick: () => void;
}

/** Generate static map URL for event location */
function getStaticMapUrl(lat: number, lng: number, zoom = 12): string {
  // Using OpenStreetMap static tiles via a tile proxy
  // This creates a simple static map centered on the location
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export default function EventCard({ event, coverPhoto, photoCount, dateRange, onClick }: EventCardProps) {
  const hasLocation = event.locationLat !== undefined && event.locationLng !== undefined;
  const displayDate = event.startDate 
    ? formatDate(event.startDate) + (event.isMultiDay && event.endDate ? ` - ${formatDate(event.endDate)}` : '')
    : dateRange;
  
  return (
    <button
      onClick={onClick}
      className="
        group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden
        shadow-sm hover:shadow-xl transition-all duration-300 ease-out
        hover:-translate-y-1 text-left w-full
        border border-gray-100 dark:border-gray-700
      "
    >
      {/* Cover image / Map preview */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {coverPhoto ? (
          // Photo cover
          <img
            src={coverPhoto.thumbnailUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : hasLocation ? (
          // Map preview
          <div className="w-full h-full relative">
            <img
              src={getStaticMapUrl(event.locationLat!, event.locationLng!)}
              alt="Event location"
              className="w-full h-full object-cover opacity-80"
            />
            {/* Map overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/40 via-transparent to-secondary-900/20" />
            {/* Pin marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-primary-500 drop-shadow-lg">
                <MapPin className="w-8 h-8" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          // Empty placeholder
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full">
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </div>
        
        {/* Event type badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
          {EVENT_TYPE_LABELS[event.eventType]}
        </div>
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Info section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {event.name}
        </h3>
        
        <div className="flex flex-col gap-1">
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
      </div>
    </button>
  );
}
