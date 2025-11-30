/**
 * PhotosTab - Main content for the Photos view.
 * 
 * Combines:
 * - Upload area
 * - Filters
 * - Event list or Event detail view
 */

'use client';

import { usePhotos } from '@/context/PhotoContext';
import UploadArea from './UploadArea';
import PhotoFilters from './PhotoFilters';
import EventList from './EventList';
import EventDetail from './EventDetail';

export default function PhotosTab() {
  const { selectedEventId, events } = usePhotos();
  
  return (
    <div className="space-y-8">
      {/* Upload area - always visible */}
      <section>
        <UploadArea />
      </section>
      
      {/* Main content - either event list or event detail */}
      <section>
        {selectedEventId ? (
          <EventDetail />
        ) : (
          <>
            {/* Filters - only show when we have events */}
            {events.length > 0 && (
              <div className="mb-6">
                <PhotoFilters />
              </div>
            )}
            
            <EventList />
          </>
        )}
      </section>
    </div>
  );
}
