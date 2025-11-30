/**
 * MapView - World map showing photo locations.
 * 
 * Uses react-leaflet to display an OpenStreetMap.
 * Photos with GPS coordinates are clustered and shown as markers.
 * 
 * This component handles:
 * - Map initialization and styling
 * - Photo clustering by location
 * - Event filtering
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, ImageIcon } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { clusterPhotosByLocation } from '@/utils/helpers';
import MapFilters from './MapFilters';

// Dynamically import the map to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('./MapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">Loading map...</div>
      </div>
    )
  }
);

export default function MapView() {
  const { photos, events, mapFilters } = usePhotos();
  
  // Get photos with location, filtered by selected events
  const filteredPhotos = useMemo(() => {
    let filtered = photos.filter(p => p.gpsLat !== null && p.gpsLng !== null);
    
    if (mapFilters.selectedEventIds.length > 0) {
      filtered = filtered.filter(p => mapFilters.selectedEventIds.includes(p.eventId));
    }
    
    return filtered;
  }, [photos, mapFilters.selectedEventIds]);
  
  // Cluster photos by location
  const clusters = useMemo(() => {
    return clusterPhotosByLocation(filteredPhotos);
  }, [filteredPhotos]);
  
  // Check if there are any photos with location
  const hasPhotosWithLocation = photos.some(p => p.gpsLat !== null && p.gpsLng !== null);
  
  if (!hasPhotosWithLocation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No photos on the map yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Upload photos with GPS location data to see them displayed on the map.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filters and stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <span>
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} with location
            {clusters.length > 0 && ` in ${clusters.length} location${clusters.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <MapFilters />
      </div>
      
      {/* Map */}
      <div className="h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <MapContainer clusters={clusters} events={events} />
      </div>
    </div>
  );
}
