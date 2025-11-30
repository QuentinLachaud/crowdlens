/**
 * PhotosTab - All photos displayed as a mosaic with filters.
 * 
 * Features:
 * - All photos mosaic view
 * - Favorites filter toggle
 * - Event dropdown with search
 * - Country/City filter
 * - Photo favorite star on thumbnails
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Star, ChevronDown, Search, X, MapPin, Calendar, Images, Filter } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoModal from './PhotoModal';
import { Photo } from '@/types';

export default function PhotosTab() {
  const { photos, events, photoFilters, setPhotoFilters, togglePhotoFavorite } = usePhotos();
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target as Node)) {
        setShowEventDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  
  // Extract unique locations from events
  const locations = useMemo(() => {
    const locs = new Map<string, { country?: string; city?: string }>();
    events.forEach(e => {
      if (e.locationName) {
        const parts = e.locationName.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const city = parts[0];
          const country = parts[parts.length - 1];
          locs.set(`${city}, ${country}`, { city, country });
        } else if (parts[0]) {
          locs.set(parts[0], { city: parts[0] });
        }
      }
    });
    return Array.from(locs.entries());
  }, [events]);
  
  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!eventSearch) return events;
    return events.filter(e => 
      e.name.toLowerCase().includes(eventSearch.toLowerCase())
    );
  }, [events, eventSearch]);
  
  // Filter photos based on all filters
  const filteredPhotos = useMemo(() => {
    let result = [...photos];
    
    // Filter by favorites
    if (photoFilters.showFavoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }
    
    // Filter by event
    if (photoFilters.selectedEventId) {
      result = result.filter(p => p.eventId === photoFilters.selectedEventId);
    }
    
    // Filter by location (event location)
    if (photoFilters.selectedCity || photoFilters.selectedCountry) {
      const eventIds = events
        .filter(e => {
          if (!e.locationName) return false;
          const parts = e.locationName.split(',').map(s => s.trim());
          const city = parts[0];
          const country = parts[parts.length - 1];
          if (photoFilters.selectedCity && city !== photoFilters.selectedCity) return false;
          if (photoFilters.selectedCountry && country !== photoFilters.selectedCountry) return false;
          return true;
        })
        .map(e => e.id);
      result = result.filter(p => eventIds.includes(p.eventId));
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.takenAt || a.uploadedAt;
      const dateB = b.takenAt || b.uploadedAt;
      return dateB.getTime() - dateA.getTime();
    });
    
    return result;
  }, [photos, events, photoFilters]);
  
  const selectedEvent = photoFilters.selectedEventId 
    ? events.find(e => e.id === photoFilters.selectedEventId) 
    : null;
  
  const selectedLocation = photoFilters.selectedCity || photoFilters.selectedCountry;
  
  const clearFilters = () => {
    setPhotoFilters({ 
      showFavoritesOnly: false, 
      selectedEventId: null, 
      selectedCity: null, 
      selectedCountry: null 
    });
  };
  
  const hasActiveFilters = photoFilters.showFavoritesOnly || 
    photoFilters.selectedEventId || 
    photoFilters.selectedCity || 
    photoFilters.selectedCountry;
  
  return (
    <div className="space-y-6">
      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Favorites Toggle */}
          <button
            onClick={() => setPhotoFilters({ showFavoritesOnly: !photoFilters.showFavoritesOnly })}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-300
              ${photoFilters.showFavoritesOnly 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Star 
              className={`w-4 h-4 transition-all ${photoFilters.showFavoritesOnly ? 'fill-current' : ''}`} 
            />
            <span>Favorites</span>
          </button>
          
          {/* Event Filter Dropdown */}
          <div className="relative" ref={eventDropdownRef}>
            <button
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-200
                ${selectedEvent 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <Calendar className="w-4 h-4" />
              <span>{selectedEvent?.name || 'All Events'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showEventDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {/* Search input */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search events..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Event list */}
                <div className="max-h-64 overflow-y-auto py-2">
                  <button
                    onClick={() => {
                      setPhotoFilters({ selectedEventId: null });
                      setShowEventDropdown(false);
                      setEventSearch('');
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${!selectedEvent ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : ''}`}
                  >
                    All Events
                  </button>
                  {filteredEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setPhotoFilters({ selectedEventId: event.id });
                        setShowEventDropdown(false);
                        setEventSearch('');
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedEvent?.id === event.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : ''}`}
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Location Filter */}
          {locations.length > 0 && (
            <div className="relative" ref={locationDropdownRef}>
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${selectedLocation 
                    ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 ring-2 ring-secondary-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <MapPin className="w-4 h-4" />
                <span>{selectedLocation || 'All Locations'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showLocationDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setPhotoFilters({ selectedCity: null, selectedCountry: null });
                      setShowLocationDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    All Locations
                  </button>
                  {locations.map(([key, loc]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setPhotoFilters({ selectedCity: loc.city || null, selectedCountry: loc.country || null });
                        setShowLocationDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
          
          {/* Photo count */}
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Images className="w-4 h-4" />
            <span>{filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      
      {/* Photos Mosaic */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16">
          <Images className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            {hasActiveFilters ? 'No photos match your filters' : 'No photos yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more photos'
              : 'Upload photos to an event to see them here'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredPhotos.map(photo => (
            <div key={photo.id} className="relative group">
              <PhotoThumbnail
                photo={photo}
                onClick={() => setSelectedPhoto(photo)}
              />
              {/* Favorite star overlay */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePhotoFavorite(photo.id);
                }}
                className={`
                  absolute top-2 left-2 p-1.5 rounded-full transition-all duration-300
                  ${photo.isFavorite 
                    ? 'bg-pink-500 text-white opacity-100 scale-100' 
                    : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 hover:bg-pink-500'
                  }
                `}
              >
                <Star className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
