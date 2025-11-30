/**
 * MapContainer - The actual Leaflet map component.
 * 
 * Separated from MapView to enable dynamic import (SSR-safe).
 * Renders the map tiles and photo markers.
 */

'use client';

import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PhotoCluster, Event } from '@/types';
import PhotoMapMarker from './PhotoMapMarker';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  clusters: PhotoCluster[];
  events: Event[];
}

// Component to fit bounds to markers
function FitBounds({ clusters }: { clusters: PhotoCluster[] }) {
  const map = useMap();
  const hasFitRef = useRef(false);
  
  useEffect(() => {
    if (clusters.length > 0 && !hasFitRef.current) {
      const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      hasFitRef.current = true;
    }
  }, [clusters, map]);
  
  return null;
}

export default function MapContainer({ clusters, events }: MapContainerProps) {
  // Default center (roughly center of the world)
  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;
  
  // Calculate initial center if we have clusters
  const center: [number, number] = clusters.length > 0
    ? [
        clusters.reduce((sum, c) => sum + c.lat, 0) / clusters.length,
        clusters.reduce((sum, c) => sum + c.lng, 0) / clusters.length
      ]
    : defaultCenter;
  
  return (
    <LeafletMapContainer
      center={center}
      zoom={defaultZoom}
      className="w-full h-full z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {clusters.length > 0 && <FitBounds clusters={clusters} />}
      
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
