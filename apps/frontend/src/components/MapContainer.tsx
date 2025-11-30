/**
 * MapContainer - Leaflet map component.
 * 
 * Features:
 * - SSR-safe (dynamically imported)
 * - User location marker with pulse animation
 * - Photo cluster markers
 * - Auto-fit bounds to content
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PhotoCluster, Event, UserLocation } from '@/types';
import { getUserLocation, DEFAULT_ZOOM } from '@/services/geolocation';
import PhotoMapMarker from './PhotoMapMarker';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  clusters: PhotoCluster[];
  events: Event[];
}

/** Custom user location marker icon */
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-marker-wrapper">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

/** Component to manage map view and bounds */
function MapController({ 
  clusters, 
  userLocation 
}: { 
  clusters: PhotoCluster[];
  userLocation: UserLocation | null;
}) {
  const map = useMap();
  const hasFitRef = useRef(false);
  
  useEffect(() => {
    // Only fit bounds once on initial load
    if (hasFitRef.current) return;
    
    if (clusters.length > 0) {
      // Fit to photo clusters
      const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      hasFitRef.current = true;
    } else if (userLocation) {
      // Center on user location with ~5000km view
      map.setView([userLocation.lat, userLocation.lng], DEFAULT_ZOOM);
      hasFitRef.current = true;
    }
  }, [clusters, userLocation, map]);
  
  return null;
}

export default function MapContainer({ clusters, events }: MapContainerProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  
  // Fetch user location on mount
  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);
  
  // Default center - will be updated by MapController
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : [40, -20]; // Atlantic Ocean (neutral starting point)
  
  return (
    <LeafletMapContainer
      center={defaultCenter}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController clusters={clusters} userLocation={userLocation} />
      
      {/* User location marker */}
      {userLocation && (
        <>
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          />
          {/* Accuracy circle (if GPS) */}
          {userLocation.accuracy && userLocation.accuracy < 5000 && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          )}
        </>
      )}
      
      {/* Photo cluster markers */}
      {clusters.map((cluster, index) => {
        const event = events.find(e => e.id === cluster.representative.eventId);
        return (
          <PhotoMapMarker
            key={`${cluster.lat}-${cluster.lng}-${index}`}
            cluster={cluster}
            eventName={event?.name || 'Unknown Event'}
          />
        );
      })}
    </LeafletMapContainer>
  );
}
