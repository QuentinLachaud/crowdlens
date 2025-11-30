/**
 * MapView - World map showing events and photos with satellite imagery.
 * 
 * Features:
 * - Satellite map imagery
 * - Shows map centered on user's location when no content
 * - Clickable event thumbnails at locations
 * - Event filtering
 * - Responsive height
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ImageIcon } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { clusterPhotosByLocation } from '@/utils/helpers';
import MapFilters from './MapFilters';

// Dynamic import for SSR-safe Leaflet
const MapContainer = dynamic(
  () => import('./MapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">Loading map...</span>
        </div>
      </div>
    )
  }
);

export default function MapView() {
  const { photos, events, mapFilters, setSelectedEventId } = usePhotos();
  
  // Filter photos by selected events (if any filters active)
  const filteredPhotos = useMemo(() => {
    let filtered = photos.filter(p => p.gpsLat !== null && p.gpsLng !== null);
    
    if (mapFilters.selectedEventIds.length > 0) {
      filtered = filtered.filter(p => mapFilters.selectedEventIds.includes(p.eventId));
    }
    
    return filtered;
  }, [photos, mapFilters.selectedEventIds]);
  
  // Cluster photos by proximity
  const clusters = useMemo(() => {
    return clusterPhotosByLocation(filteredPhotos);
  }, [filteredPhotos]);
  
  const hasPhotosWithLocation = photos.some(p => p.gpsLat !== null && p.gpsLng !== null);
  
  // Count events with location
  const eventsWithLocation = useMemo(() => {
    return events.filter(e => e.locationLat !== undefined && e.locationLng !== undefined);
  }, [events]);
  
  const hasContent = hasPhotosWithLocation || eventsWithLocation.length > 0;
  
  // Handle event click to navigate to event detail
  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };
  
  return (
    <div className="space-y-4">
      {/* Header with stats and filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <span>
            {eventsWithLocation.length > 0 || filteredPhotos.length > 0
              ? `${eventsWithLocation.length} event${eventsWithLocation.length !== 1 ? 's' : ''} • ${filteredPhotos.length} photo${filteredPhotos.length !== 1 ? 's' : ''} with location`
              : 'Explore the map'
            }
          </span>
        </div>
        {hasContent && <MapFilters />}
      </div>
      
      {/* Map container - always shown, centered on user location */}
      <div className="h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <MapContainer 
          clusters={clusters} 
          events={events} 
          photos={photos}
          onEventClick={handleEventClick}
        />
      </div>
      
      {/* Helpful hint when no content */}
      {!hasContent && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Upload photos with GPS data or create events with locations to see them on the map
        </p>
      )}
    </div>
  );
}
