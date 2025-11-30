/**
 * EventDetail - Expanded view of a single event with all its photos.
 * 
 * Displayed when user clicks on an event card.
 * Shows a grid of photo thumbnails with the ability to close and return to the list.
 */

'use client';

import { useMemo } from 'react';
import { ArrowLeft, Calendar, MapPin, Trash2 } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { getDateRange, groupPhotosByTime } from '@/utils/helpers';
import PhotoGrid from './PhotoGrid';

export default function EventDetail() {
  const { selectedEventId, setSelectedEventId, events, photos, deleteEvent } = usePhotos();
  
  const event = useMemo(() => {
    return events.find(e => e.id === selectedEventId);
  }, [events, selectedEventId]);
  
  const eventPhotos = useMemo(() => {
    return photos.filter(p => p.eventId === selectedEventId);
  }, [photos, selectedEventId]);
  
  const dateRange = useMemo(() => {
    return getDateRange(eventPhotos);
  }, [eventPhotos]);
  
  const photosWithLocation = useMemo(() => {
    return eventPhotos.filter(p => p.gpsLat !== null && p.gpsLng !== null).length;
  }, [eventPhotos]);
  
  // Group photos by month
  const groupedPhotos = useMemo(() => {
    const groups = groupPhotosByTime(eventPhotos);
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [eventPhotos]);
  
  if (!event || !selectedEventId) return null;
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${event.name}" and all its photos?`)) {
      deleteEvent(selectedEventId);
      setSelectedEventId(null);
    }
  };
  
  const formatGroupKey = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setSelectedEventId(null)}
            className="
              p-2 rounded-lg text-gray-500 hover:text-gray-700 
              dark:text-gray-400 dark:hover:text-gray-200 
              hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-colors mt-1
            "
            aria-label="Back to events"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{dateRange}</span>
              </div>
              <span>•</span>
              <span>{eventPhotos.length} photo{eventPhotos.length !== 1 ? 's' : ''}</span>
              {photosWithLocation > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{photosWithLocation} with location</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="
            p-2 rounded-lg text-red-500 hover:text-red-600 
            hover:bg-red-50 dark:hover:bg-red-900/20
            transition-colors
          "
          aria-label="Delete event"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      {/* Photo groups by month */}
      <div className="space-y-8">
        {groupedPhotos.map(([key, groupPhotos]) => (
          <div key={key}>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {formatGroupKey(key)}
            </h3>
            <PhotoGrid photos={groupPhotos} />
          </div>
        ))}
      </div>
    </div>
  );
}
