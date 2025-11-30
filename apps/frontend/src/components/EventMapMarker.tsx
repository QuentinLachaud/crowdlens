/**
 * EventMapMarker - Clickable event thumbnail marker on the map.
 * 
 * Features:
 * - Shows event photo thumbnail or placeholder
 * - Satisfying hover and click animations
 * - Compact but clearly visible
 * - Click navigates to event detail
 */

'use client';

import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Photo } from '@/types';

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
    const size = 52;
    const hasPhoto = photo !== null;
    
    return L.divIcon({
      className: 'event-map-marker',
      html: `
        <div 
          class="event-marker-container"
          style="
            width: ${size}px;
            height: ${size}px;
            cursor: pointer;
            transition: transform 0.2s ease-out;
          "
          onmouseover="this.style.transform='scale(1.15)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          <div style="
            width: 100%;
            height: 100%;
            border-radius: 12px;
            overflow: hidden;
            border: 3px solid white;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, #e5634f, #c04d3d);
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
            
            <!-- Photo count badge -->
            ${photoCount > 0 ? `
              <div style="
                position: absolute;
                bottom: -6px;
                right: -6px;
                min-width: 22px;
                height: 22px;
                padding: 0 6px;
                border-radius: 11px;
                background: #e5634f;
                color: white;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                ${photoCount > 99 ? '99+' : photoCount}
              </div>
            ` : ''}
          </div>
          
          <!-- Pointer triangle -->
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 10px solid white;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
          "></div>
        </div>
      `,
      iconSize: [size, size + 10],
      iconAnchor: [size / 2, size + 10],
      popupAnchor: [0, -(size + 5)],
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
