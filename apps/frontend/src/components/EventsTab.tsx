/**
 * EventsTab - Grid view of all events with filtering and sorting.
 * 
 * Features:
 * - Filter ribbon with favorites toggle, date sort, location filter
 * - Event search box
 * - Event cards with photo cycling, favorite star, edit/add buttons
 * - Single event detail view with zoom slider
 * - Photo upload button in ribbon
 */

'use client';

import { useMemo, useState, useRef, ChangeEvent } from 'react';
import { Star, ArrowUpDown, MapPin, Calendar, FolderOpen, Upload, Plus, Search } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { getCoverPhoto, getDateRange } from '@/utils/helpers';
import EventCardEnhanced from './EventCardEnhanced';
import EventDetailView from './EventDetailView';

/** Extract unique locations (city-like) from events */
function getUniqueLocations(events: { locationName?: string }[]): string[] {
  const locations = new Set<string>();
  events.forEach(e => {
    if (e.locationName) {
      // Try to extract city from location (split by comma, take first meaningful part)
      const parts = e.locationName.split(',').map(s => s.trim());
      if (parts.length > 0 && parts[0]) {
        locations.add(parts[0]);
      }
    }
  });
  return Array.from(locations).sort();
}

export default function EventsTab() {
  const { 
    events, 
    photos, 
    eventFilters, 
    setEventFilters,
    selectedEventId,
    setSelectedEventId,
    setPendingFiles,
  } = usePhotos();
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Get unique locations for filter
  const locations = useMemo(() => getUniqueLocations(events), [events]);
  
  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles(files);
    }
    e.target.value = '';
  };
  
  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.locationName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by favorites
    if (eventFilters.showFavoritesOnly) {
      filtered = filtered.filter(e => e.isFavorite);
    }
    
    // Filter by locations
    if (eventFilters.selectedLocations.length > 0) {
      filtered = filtered.filter(e => {
        if (!e.locationName) return false;
        const eventCity = e.locationName.split(',')[0]?.trim();
        return eventCity && eventFilters.selectedLocations.includes(eventCity);
      });
    }
    
    // Sort events
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (eventFilters.sortBy) {
        case 'startDate':
          const dateA = a.startDate || a.createdAt;
          const dateB = b.startDate || b.createdAt;
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return eventFilters.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [events, eventFilters, searchQuery]);
  
  // If an event is selected, show the detail view
  if (selectedEventId) {
    return <EventDetailView />;
  }
  
  const toggleFavoritesFilter = () => {
    setEventFilters({ showFavoritesOnly: !eventFilters.showFavoritesOnly });
  };
  
  const toggleSortOrder = () => {
    setEventFilters({ sortOrder: eventFilters.sortOrder === 'asc' ? 'desc' : 'asc' });
  };
  
  const setSortBy = (sortBy: 'startDate' | 'createdAt' | 'name') => {
    setEventFilters({ sortBy });
  };
  
  const toggleLocation = (location: string) => {
    const current = eventFilters.selectedLocations;
    const updated = current.includes(location)
      ? current.filter(l => l !== location)
      : [...current, location];
    setEventFilters({ selectedLocations: updated });
  };
  
  return (
    <div className="space-y-6">
      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 rounded-lg
                bg-gray-100 dark:bg-gray-800 
                border-0 text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-all duration-200
              "
            />
          </div>
          
          {/* Favorites Toggle */}
          <button
            onClick={toggleFavoritesFilter}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${eventFilters.showFavoritesOnly 
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Star 
              className={`w-4 h-4 transition-all ${eventFilters.showFavoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} 
            />
            <span>Favorites</span>
          </button>
          
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
            <select
              value={eventFilters.sortBy}
              onChange={(e) => setSortBy(e.target.value as 'startDate' | 'createdAt' | 'name')}
              className="
                px-3 py-2 rounded-lg text-sm font-medium
                bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                border-0 focus:ring-2 focus:ring-primary-500 cursor-pointer
              "
            >
              <option value="startDate">Start Date</option>
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="
                p-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700
                transition-colors
              "
              title={eventFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown className={`w-4 h-4 transition-transform ${eventFilters.sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Location Filter */}
          {locations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${eventFilters.selectedLocations.length > 0 
                    ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 ring-2 ring-secondary-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {eventFilters.selectedLocations.length > 0 
                    ? `${eventFilters.selectedLocations.length} location${eventFilters.selectedLocations.length > 1 ? 's' : ''}`
                    : 'All Locations'
                  }
                </span>
              </button>
              
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLocationDropdown(false)} 
                  />
                  <div className="
                    absolute top-full left-0 mt-2 z-50
                    w-64 max-h-64 overflow-y-auto
                    bg-white dark:bg-gray-800 rounded-xl shadow-xl
                    border border-gray-200 dark:border-gray-700
                    py-2
                  ">
                    {locations.map(location => (
                      <button
                        key={location}
                        onClick={() => toggleLocation(location)}
                        className="
                          w-full flex items-center gap-3 px-4 py-2
                          hover:bg-gray-100 dark:hover:bg-gray-700
                          text-left text-sm text-gray-700 dark:text-gray-300
                        "
                      >
                        <div className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center
                          transition-colors
                          ${eventFilters.selectedLocations.includes(location)
                            ? 'bg-secondary-500 border-secondary-500 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                          }
                        `}>
                          {eventFilters.selectedLocations.includes(location) && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>{location}</span>
                      </button>
                    ))}
                    
                    {eventFilters.selectedLocations.length > 0 && (
                      <button
                        onClick={() => setEventFilters({ selectedLocations: [] })}
                        className="
                          w-full px-4 py-2 mt-2 border-t border-gray-200 dark:border-gray-700
                          text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700
                        "
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Results count */}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
            
            {/* Upload Photos Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                accept="image/*"
                multiple
                // @ts-ignore - webkitdirectory is valid but not in React types
                webkitdirectory=""
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  bg-primary-500 hover:bg-primary-600 text-white
                  transition-all duration-200 shadow-sm hover:shadow-md
                "
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            {eventFilters.showFavoritesOnly ? 'No favorite events' : 'No events yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {eventFilters.showFavoritesOnly 
              ? 'Star some events to see them here'
              : 'Create your first event to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const eventPhotos = photos.filter(p => p.eventId === event.id);
            const coverPhoto = getCoverPhoto(eventPhotos);
            const dateRange = getDateRange(eventPhotos);
            
            return (
              <EventCardEnhanced
                key={event.id}
                event={event}
                photos={eventPhotos}
                coverPhoto={coverPhoto}
                photoCount={eventPhotos.length}
                dateRange={dateRange}
                onClick={() => setSelectedEventId(event.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
