/**
 * MapFilters - Event filter controls for the map view.
 * 
 * Allows users to toggle which events are shown on the map.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';

export default function MapFilters() {
  const { events, mapFilters, setMapFilters, photos } = usePhotos();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get events that have photos with location
  const eventsWithLocation = events.filter(event => {
    return photos.some(p => p.eventId === event.id && p.gpsLat !== null && p.gpsLng !== null);
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleEvent = (eventId: string) => {
    const current = mapFilters.selectedEventIds;
    if (current.includes(eventId)) {
      setMapFilters({ selectedEventIds: current.filter(id => id !== eventId) });
    } else {
      setMapFilters({ selectedEventIds: [...current, eventId] });
    }
  };
  
  const selectAll = () => {
    setMapFilters({ selectedEventIds: eventsWithLocation.map(e => e.id) });
  };
  
  const selectNone = () => {
    setMapFilters({ selectedEventIds: [] });
  };
  
  if (eventsWithLocation.length === 0) {
    return null;
  }
  
  const filterCount = mapFilters.selectedEventIds.length;
  const allSelected = filterCount === eventsWithLocation.length || filterCount === 0;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          border transition-all duration-200
          ${!allSelected
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          }
          hover:border-primary-400 dark:hover:border-primary-600
        `}
      >
        <Filter className="w-4 h-4" />
        <span>Filter Events</span>
        {!allSelected && (
          <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
            {filterCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 animate-fade-in">
          {/* Quick actions */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={selectAll}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={selectNone}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Select None
            </button>
          </div>
          
          {/* Event list */}
          <div className="max-h-60 overflow-y-auto">
            {eventsWithLocation.map(event => {
              const isSelected = mapFilters.selectedEventIds.length === 0 || 
                                 mapFilters.selectedEventIds.includes(event.id);
              const photoCount = photos.filter(
                p => p.eventId === event.id && p.gpsLat !== null
              ).length;
              
              return (
                <button
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  className="
                    w-full flex items-center gap-3 px-4 py-2.5 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  "
                >
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${isSelected
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {photoCount} photo{photoCount !== 1 ? 's' : ''} with location
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
