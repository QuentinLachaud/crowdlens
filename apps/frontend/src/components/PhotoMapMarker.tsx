/**
 * PhotoMapMarker - Map marker with photo thumbnail popup.
 * 
 * Displays a custom marker for each photo cluster.
 * Shows photo preview and metadata on click.
 */

'use client';

import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PhotoCluster } from '@/types';
import { formatDate } from '@/utils/helpers';

interface PhotoMapMarkerProps {
  cluster: PhotoCluster;
  eventName: string;
}

export default function PhotoMapMarker({ cluster, eventName }: PhotoMapMarkerProps) {
  const { representative, photos, lat, lng } = cluster;
  
  // Create custom icon with photo count
  const icon = useMemo(() => {
    const count = photos.length;
    const size = count > 1 ? 48 : 40;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 8px;
          overflow: hidden;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background: #e5634f;
          position: relative;
        ">
          <img 
            src="${representative.thumbnailUrl}" 
            alt="" 
            style="width: 100%; height: 100%; object-fit: cover;"
          />
          ${count > 1 ? `
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #e5634f;
              color: white;
              font-size: 11px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
            ">
              ${count > 99 ? '99+' : count}
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 5)],
    });
  }, [photos.length, representative.thumbnailUrl]);
  
  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <div className="min-w-[200px] max-w-[280px]">
          {/* Photo preview */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
            <img
              src={representative.thumbnailUrl}
              alt={representative.fileName}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{photos.length - 1} more
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {eventName}
            </h4>
            {representative.takenAt && (
              <p className="text-xs text-gray-500">
                {formatDate(representative.takenAt)}
              </p>
            )}
            <p className="text-xs text-gray-400">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} at this location
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
