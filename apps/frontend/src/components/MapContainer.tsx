/**
 * MapContainer - Leaflet map component with satellite imagery.
 * 
 * Features:
 * - SSR-safe (dynamically imported)
 * - Satellite imagery (Esri World Imagery)
 * - User location marker with pulse animation
 * - Clickable event thumbnails at event locations
 * - Auto-fit bounds to content
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PhotoCluster, Event, UserLocation, Photo } from '@/types';
import { getUserLocation, DEFAULT_ZOOM } from '@/services/geolocation';
import EventMapMarker from './EventMapMarker';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  clusters: PhotoCluster[];
  events: Event[];
  photos: Photo[];
  onEventClick: (eventId: string) => void;
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
  events,
  userLocation 
}: { 
  clusters: PhotoCluster[];
  events: Event[];
  userLocation: UserLocation | null;
}) {
  const map = useMap();
  const hasFitRef = useRef(false);
  
  useEffect(() => {
    // Only fit bounds once on initial load
    if (hasFitRef.current) return;
    
    // Get all event locations
    const eventLocations = events
      .filter(e => e.locationLat !== undefined && e.locationLng !== undefined)
      .map(e => [e.locationLat!, e.locationLng!] as [number, number]);
    
    // Combine with cluster locations
    const allLocations = [
      ...clusters.map(c => [c.lat, c.lng] as [number, number]),
      ...eventLocations,
    ];
    
    if (allLocations.length > 0) {
      const bounds = L.latLngBounds(allLocations);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      hasFitRef.current = true;
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], DEFAULT_ZOOM);
      hasFitRef.current = true;
    }
  }, [clusters, events, userLocation, map]);
  
  return null;
}

export default function MapContainer({ clusters, events, photos, onEventClick }: MapContainerProps) {
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
      minZoom={2}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
      className="w-full h-full z-0"
      scrollWheelZoom={true}
    >
      {/* Satellite imagery from Esri */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {/* Labels overlay for place names */}
      <TileLayer
        attribution=''
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      />
      
      <MapController clusters={clusters} events={events} userLocation={userLocation} />
      
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
          <EventMapMarker
            key={`cluster-${cluster.lat}-${cluster.lng}-${index}`}
            lat={cluster.lat}
            lng={cluster.lng}
            photo={cluster.representative}
            eventName={event?.name || 'Unknown Event'}
            photoCount={cluster.photos.length}
            onClick={() => event && onEventClick(event.id)}
          />
        );
      })}
      
      {/* Event location markers (for events with no photos but with location) */}
      {events
        .filter(e => 
          e.locationLat !== undefined && 
          e.locationLng !== undefined &&
          !clusters.some(c => c.photos.some(p => p.eventId === e.id))
        )
        .map(event => {
          const eventPhotos = photos.filter(p => p.eventId === event.id);
          const coverPhoto = eventPhotos[0] || null;
          return (
            <EventMapMarker
              key={`event-${event.id}`}
              lat={event.locationLat!}
              lng={event.locationLng!}
              photo={coverPhoto}
              eventName={event.name}
              photoCount={eventPhotos.length}
              onClick={() => onEventClick(event.id)}
            />
          );
        })
      }
    </LeafletMapContainer>
  );
}
