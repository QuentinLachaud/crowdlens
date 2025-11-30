/**
 * EventCard - Individual card displaying an event summary.
 * 
 * Shows:
 * - Cover photo (or placeholder)
 * - Event name
 * - Photo count
 * - Date range
 * 
 * Features smooth hover animations and transitions.
 */

'use client';

import { Calendar, ImageIcon } from 'lucide-react';
import { Event, Photo } from '@/types';

interface EventCardProps {
  event: Event;
  coverPhoto: Photo | null;
  photoCount: number;
  dateRange: string;
  onClick: () => void;
}

export default function EventCard({ event, coverPhoto, photoCount, dateRange, onClick }: EventCardProps) {
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
      {/* Cover image */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto.thumbnailUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full">
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Info section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
          {event.name}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{dateRange}</span>
        </div>
      </div>
    </button>
  );
}
