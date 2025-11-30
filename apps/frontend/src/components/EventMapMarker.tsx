/**
 * EventMapMarker - Clickable event thumbnail marker on the map.
 * 
 * Features:
 * - Shows event photo thumbnail or event type icon placeholder
 * - Photo count badge on bottom-right corner (outside the image)
 * - Count format: exact until 50, then 50+, 100+, 200+, etc up to 1000+
 * - Satisfying hover and click animations
 * - Click navigates directly to event detail
 */

'use client';

import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Photo, EventType } from '@/types';

/** SVG paths for event type icons */
const EVENT_TYPE_SVG: Record<EventType, string> = {
  'concert': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'festival': '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
  'graduation': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  'wedding': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'outing': '<path d="M17.5 5.5L9 2 2 5.5V19l7 3.5 7-3.5"/><path d="M9 22V8l8.5-4"/><path d="M16 5.5v14.5l6-3V2l-6 3.5Z"/>',
  'vacation': '<path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/>',
  'tourist-attraction': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'school-trip': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  'get-together': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'birthday': '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
  'anniversary': '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4h12v-4Z"/>',
  'corporate': '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'sports': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  'race': '<circle cx="17" cy="4" r="2"/><path d="M15 9l-3 5 3 4"/><path d="M12 14l-3-3-3 4"/><path d="M9 11l4-3 2 1"/><path d="M3 18h4l3-8"/>',
  'religious': '<path d="M12 2v20"/><path d="M2 10h20"/>',
  'charity': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/>',
  'exhibition': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  'conference': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'other': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
};

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
  eventType?: EventType;
  photoCount: number;
  onClick: () => void;
}

export default function EventMapMarker({ 
  lat, 
  lng, 
  photo, 
  eventName,
  eventType = 'other',
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
                  ${EVENT_TYPE_SVG[eventType] || EVENT_TYPE_SVG['other']}
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
  }, [photo, eventName, eventType, photoCount]);
  
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
