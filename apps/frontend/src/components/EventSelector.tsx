/**
 * EventSelector - Modal for choosing which event to upload photos to.
 * 
 * Displayed after user selects files for upload.
 * Options:
 * - Select an existing event from the list
 * - Quick-create a new event with just a name
 */

'use client';

import { useState } from 'react';
import { X, Plus, Folder, Check } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { EVENT_TYPE_LABELS } from '@/types';

export default function EventSelector() {
  const { 
    uploadState, 
    events, 
    pendingFiles, 
    createEvent, 
    uploadPhotosToEvent, 
    cancelUpload 
  } = usePhotos();
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  // Only render when in selecting-event state
  if (uploadState !== 'selecting-event') return null;
  
  const handleConfirm = async () => {
    let eventId = selectedEventId;
    
    // Quick-create event if creating new
    if (isCreatingNew && newEventName.trim()) {
      const newEvent = createEvent({
        name: newEventName.trim(),
        eventType: 'other',
        isMultiDay: false,
        startDate: new Date(),
        endDate: null,
      });
      eventId = newEvent.id;
    }
    
    if (eventId) {
      await uploadPhotosToEvent(eventId);
    }
  };
  
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setIsCreatingNew(false);
  };
  
  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedEventId(null);
  };
  
  const canConfirm = selectedEventId || (isCreatingNew && newEventName.trim());
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={cancelUpload}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Choose an Event
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {pendingFiles.length} photo{pendingFiles.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={cancelUpload}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 max-h-80 overflow-y-auto">
            {/* Create new event option */}
            <button
              onClick={handleCreateNew}
              className={`
                w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                ${isCreatingNew 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                ${isCreatingNew 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }
              `}>
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  Create new event
                </span>
              </div>
              {isCreatingNew && <Check className="w-5 h-5 text-primary-500" />}
            </button>
            
            {/* New event name input */}
            {isCreatingNew && (
              <div className="mt-4 animate-fade-in">
                <input
                  type="text"
                  placeholder="Event name (e.g., Summer Vacation 2024)"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  autoFocus
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200
                  "
                />
              </div>
            )}
            
            {/* Existing events */}
            {events.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Or choose existing
                </p>
                {events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event.id)}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                      ${selectedEventId === event.id 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                      ${selectedEventId === event.id 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="font-medium text-gray-900 dark:text-white block">
                        {event.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {EVENT_TYPE_LABELS[event.eventType]}
                      </span>
                    </div>
                    {selectedEventId === event.id && (
                      <Check className="w-5 h-5 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={cancelUpload}
              className="
                px-6 py-3 text-gray-700 dark:text-gray-300 font-medium
                rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`
                px-6 py-3 font-semibold rounded-xl transition-all duration-200
                ${canConfirm
                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Upload Photos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
