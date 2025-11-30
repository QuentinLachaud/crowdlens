/**
 * EventMapMarker - Clickable event thumbnail marker on the map.
 * 
 * Features:
 * - Shows event photo thumbnail or placeholder
 * - Photo count badge on bottom-right corner (outside the image)
 * - Count format: exact until 50, then 50+, 100+, 200+, etc up to 1000+
 * - Satisfying hover and click animations
 * - Click navigates directly to event detail
 */

'use client';

import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Photo } from '@/types';

/** Format photo count for display */
function formatPhotoCount(count: number): string {
  if (count <= 50) return count.toString();
  if (count < 100) return '50+';
  if (count < 200) return '100+';
  if (count < 500) return '200+';
  if (count < 1000) return '500+';
  return '1000+';
}

interface EventMapMarkerProps {
  lat: number;
  lng: number;
  photo: Photo | null;
  eventName: string;
  photoCount: number;
  onClick: () => void;
}

export default function EventMapMarker({ 
  lat, 
  lng, 
  photo, 
  eventName, 
  photoCount, 
  onClick 
}: EventMapMarkerProps) {
  // Create custom icon with photo thumbnail
  const icon = useMemo(() => {
    const size = 56;
    const hasPhoto = photo !== null;
    const displayCount = formatPhotoCount(photoCount);
    const isLargeCount = photoCount > 50;
    
    return L.divIcon({
      className: 'event-map-marker',
      html: `
        <div 
          class="event-marker-container"
          style="
            width: ${size}px;
            height: ${size + 16}px;
            cursor: pointer;
            transition: transform 0.2s ease-out;
            position: relative;
          "
          onmouseover="this.style.transform='scale(1.15)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 14px;
            overflow: hidden;
            border: 3px solid white;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 3px 10px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            position: relative;
          ">
            ${hasPhoto ? `
              <img 
                src="${photo.thumbnailUrl}" 
                alt="${eventName}"
                style="
                  width: 100%; 
                  height: 100%; 
                  object-fit: cover;
                  display: block;
                "
              />
            ` : `
              <div style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #6366f1, #4f46e5);
              ">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                  <line x1="9" x2="9" y1="4" y2="10"/>
                </svg>
              </div>
            `}
          </div>
          
          <!-- Photo count badge - bottom right, outside image -->
          ${photoCount > 0 ? `
            <div style="
              position: absolute;
              bottom: 10px;
              right: -8px;
              min-width: ${isLargeCount ? '34px' : '24px'};
              height: 24px;
              padding: 0 8px;
              border-radius: 12px;
              background: linear-gradient(135deg, #ef4444, #dc2626);
              color: white;
              font-size: ${isLargeCount ? '11px' : '12px'};
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              box-shadow: 0 3px 8px rgba(239,68,68,0.5), 0 1px 3px rgba(0,0,0,0.3);
              z-index: 10;
            ">
              ${displayCount}
            </div>
          ` : ''}
          
          <!-- Pointer triangle -->
          <div style="
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 12px solid white;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
          "></div>
        </div>
      `,
      iconSize: [size, size + 16],
      iconAnchor: [size / 2, size + 14],
      popupAnchor: [0, -(size + 10)],
    });
  }, [photo, eventName, photoCount]);
  
  return (
    <Marker 
      position={[lat, lng]} 
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
}
