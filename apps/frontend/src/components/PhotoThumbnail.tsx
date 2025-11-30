/**
 * PhotoThumbnail - Individual photo thumbnail with hover effects.
 * 
 * Shows the photo image and reveals metadata overlay on hover.
 * Includes delete button on hover.
 */

'use client';

import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { Photo } from '@/types';
import { formatDate } from '@/utils/helpers';
import { usePhotos } from '@/context/PhotoContext';
import { useState } from 'react';

interface PhotoThumbnailProps {
  photo: Photo;
  onClick: () => void;
}

export default function PhotoThumbnail({ photo, onClick }: PhotoThumbnailProps) {
  const { deletePhoto } = usePhotos();
  const [isDeleting, setIsDeleting] = useState(false);
  const hasLocation = photo.gpsLat !== null && photo.gpsLng !== null;
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    // Small delay for animation
    setTimeout(() => {
      deletePhoto(photo.id);
    }, 200);
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        hover:shadow-lg hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${isDeleting ? 'scale-95 opacity-0' : ''}
      `}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.fileName}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Hover overlay */}
      <div className="
        absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        flex flex-col justify-end p-3
      ">
        <div className="space-y-1">
          {photo.takenAt && (
            <div className="flex items-center gap-1 text-white text-xs">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(photo.takenAt)}</span>
            </div>
          )}
          {hasLocation && (
            <div className="flex items-center gap-1 text-white text-xs">
              <MapPin className="w-3 h-3" />
              <span>Has location</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Location indicator (always visible) */}
      {hasLocation && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500/90 backdrop-blur-sm rounded-full flex items-center justify-center">
          <MapPin className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Delete button (on hover) */}
      <div
        onClick={handleDelete}
        className="
          absolute bottom-2 right-2 w-8 h-8 
          bg-red-500/90 hover:bg-red-600 backdrop-blur-sm rounded-full 
          flex items-center justify-center cursor-pointer
          opacity-0 group-hover:opacity-100 
          transform scale-90 group-hover:scale-100
          transition-all duration-200
          hover:shadow-lg hover:shadow-red-500/30
        "
        title="Delete photo"
      >
        <Trash2 className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}
