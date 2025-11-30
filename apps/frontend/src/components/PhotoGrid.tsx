/**
 * PhotoGrid - Grid display of photo thumbnails.
 * 
 * Renders photos in a responsive masonry-style grid.
 * Each photo shows metadata on hover.
 */

'use client';

import { useState } from 'react';
import { Photo } from '@/types';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoModal from './PhotoModal';

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No photos in this group
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map(photo => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>
      
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
