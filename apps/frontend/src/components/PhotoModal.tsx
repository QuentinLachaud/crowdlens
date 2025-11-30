/**
 * PhotoModal - Full-screen photo viewer with metadata.
 * 
 * Displays a larger version of the photo with all available metadata.
 * Click anywhere outside the photo to close.
 */

'use client';

import { X, Calendar, Clock, MapPin, FileImage, Trash2, Star } from 'lucide-react';
import { Photo } from '@/types';
import { formatDate } from '@/utils/helpers';
import { usePhotos } from '@/context/PhotoContext';

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const { deletePhoto, events, togglePhotoFavorite } = usePhotos();
  const event = events.find(e => e.id === photo.eventId);
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(photo.id);
      onClose();
    }
  };
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePhotoFavorite(photo.id);
  };
  
  const hasLocation = photo.gpsLat !== null && photo.gpsLng !== null;
  
  return (
    <>
      {/* Backdrop - clicking closes the modal */}
      <div 
        className="fixed inset-0 bg-black/95 z-50 animate-fade-in cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-7xl max-h-[95vh] flex flex-col lg:flex-row bg-white dark:bg-gray-900 rounded-2xl overflow-hidden animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            className={`
              absolute top-4 left-4 z-10 p-2.5 rounded-full transition-all duration-300
              ${photo.isFavorite 
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50 scale-110' 
                : 'bg-black/50 hover:bg-black/70 text-white hover:text-pink-400'
              }
            `}
          >
            <Star className={`w-5 h-5 transition-all ${photo.isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          {/* Image - much larger */}
          <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
            <img
              src={photo.thumbnailUrl}
              alt={photo.fileName}
              className="max-w-full max-h-[70vh] lg:max-h-[90vh] object-contain"
            />
          </div>
          
          {/* Metadata sidebar */}
          <div className="w-full lg:w-80 p-6 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4 line-clamp-2">
              {photo.fileName}
            </h3>
            
            <div className="space-y-4">
              {/* Event */}
              {event && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</p>
                    <p className="text-gray-900 dark:text-white font-medium">{event.name}</p>
                  </div>
                </div>
              )}
              
              {/* Date taken */}
              {photo.takenAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taken</p>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(photo.takenAt, 'long')}</p>
                  </div>
                </div>
              )}
              
              {/* Date uploaded */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDate(photo.uploadedAt, 'long')}</p>
                </div>
              </div>
              
              {/* Location */}
              {hasLocation && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="text-gray-900 dark:text-white font-medium text-sm">
                      {photo.gpsLat?.toFixed(6)}, {photo.gpsLng?.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Delete button */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDelete}
                className="
                  w-full flex items-center justify-center gap-2 px-4 py-3
                  text-red-600 dark:text-red-400 font-medium
                  rounded-xl border border-red-200 dark:border-red-800
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  transition-colors
                "
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
