/**
 * EventList - Grid of event cards showing all photo collections.
 * 
 * Displays event cards organized by time (year groupings).
 * Supports filtering by search query and year.
 */

'use client';

import { useMemo } from 'react';
import { usePhotos } from '@/context/PhotoContext';
import { getCoverPhoto, getDateRange, getYearsFromPhotos } from '@/utils/helpers';
import EventCard from './EventCard';
import { FolderOpen } from 'lucide-react';

export default function EventList() {
  const { events, photos, photoFilters, setSelectedEventId } = usePhotos();
  
  // Calculate event data with photos
  const eventsWithData = useMemo(() => {
    return events.map(event => {
      const eventPhotos = photos.filter(p => p.eventId === event.id);
      return {
        ...event,
        photos: eventPhotos,
        coverPhoto: getCoverPhoto(eventPhotos),
        dateRange: getDateRange(eventPhotos),
        photoCount: eventPhotos.length,
      };
    });
  }, [events, photos]);
  
  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    let filtered = eventsWithData;
    
    if (photoFilters.searchQuery) {
      const query = photoFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.name.toLowerCase().includes(query));
    }
    
    if (photoFilters.selectedYear) {
      filtered = filtered.filter(e => {
        const years = getYearsFromPhotos(e.photos);
        return years.includes(photoFilters.selectedYear!);
      });
    }
    
    // Sort by most recent photo date
    return filtered.sort((a, b) => {
      const aDate = a.coverPhoto?.takenAt || a.coverPhoto?.uploadedAt || a.createdAt;
      const bDate = b.coverPhoto?.takenAt || b.coverPhoto?.uploadedAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
  }, [eventsWithData, photoFilters]);
  
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No events yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Upload some photos to create your first event and start organizing your memories.
        </p>
      </div>
    );
  }
  
  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No matching events
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map(event => (
        <EventCard
          key={event.id}
          event={event}
          coverPhoto={event.coverPhoto}
          photoCount={event.photoCount}
          dateRange={event.dateRange}
          onClick={() => setSelectedEventId(event.id)}
        />
      ))}
    </div>
  );
}
