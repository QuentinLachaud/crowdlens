/**
 * LocationPickerMap - Full-screen map for selecting event location.
 * 
 * Features:
 * - Draggable pin for location selection
 * - "Here!" confirmation button appears after pan stops
 * - Smooth animations and transitions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin } from 'lucide-react';
import { getUserLocation } from '@/services/geolocation';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

/** Custom pin icon for location selection */
const pinIcon = L.divIcon({
  className: 'location-pin',
  html: `
    <div class="pin-wrapper">
      <div class="pin-shadow"></div>
      <div class="pin-marker">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

/** Internal component to handle map events */
function MapEventHandler({ 
  onPositionChange,
  onMoveEnd
}: { 
  onPositionChange: (lat: number, lng: number) => void;
  onMoveEnd: () => void;
}) {
  const map = useMapEvents({
    move: () => {
      const center = map.getCenter();
      onPositionChange(center.lat, center.lng);
    },
    moveend: onMoveEnd,
  });
  
  return null;
}

/** Center marker that stays in the middle */
function CenterMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  return (
    <Marker 
      position={[lat, lng]} 
      icon={pinIcon}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          map.panTo(position);
        }
      }}
    />
  );
}

export default function LocationPickerMap({ 
  onSelect, 
  onClose,
  initialLat,
  initialLng 
}: LocationPickerMapProps) {
  const [position, setPosition] = useState({ lat: initialLat ?? 0, lng: initialLng ?? 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialLat);
  
  // Get initial position
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: initialLat, lng: initialLng });
      setIsLoading(false);
      return;
    }
    
    getUserLocation().then(loc => {
      setPosition({ lat: loc.lat, lng: loc.lng });
      setIsLoading(false);
    });
  }, [initialLat, initialLng]);
  
  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
    setShowConfirm(false);
  }, []);
  
  const handleMoveEnd = useCallback(() => {
    // Show "Here!" button after 100ms of no movement
    const timeout = setTimeout(() => setShowConfirm(true), 100);
    return () => clearTimeout(timeout);
  }, []);
  
  const handleConfirm = () => {
    onSelect(position.lat, position.lng);
    onClose();
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Loading map...</span>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/80 animate-fade-in" />
      
      {/* Map container */}
      <div className="fixed inset-4 md:inset-8 z-[60] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Select location</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Map */}
        <LeafletMapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler 
            onPositionChange={handlePositionChange} 
            onMoveEnd={handleMoveEnd}
          />
        </LeafletMapContainer>
        
        {/* Center pin (fixed in the middle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
          <div className="relative">
            {/* Pin */}
            <div className="text-primary-500 drop-shadow-lg animate-bounce-slow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            
            {/* "Here!" button */}
            {showConfirm && (
              <button
                onClick={handleConfirm}
                className="
                  absolute -top-2 left-full ml-2 whitespace-nowrap
                  px-4 py-2 bg-primary-500 hover:bg-primary-600 
                  text-white font-bold rounded-full shadow-lg
                  animate-pop-in transition-colors
                  pointer-events-auto
                "
              >
                Here! ✓
              </button>
            )}
          </div>
        </div>
        
        {/* Coordinates display */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono">
          {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm">
          Pan the map to position the pin
        </div>
      </div>
    </>
  );
}
