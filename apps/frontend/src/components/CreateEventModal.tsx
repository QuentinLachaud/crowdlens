/**
 * CreateEventModal - Full-featured event creation form.
 * 
 * Features:
 * - Event name and description
 * - Location picker with map and autocomplete
 * - Single/multi-day toggle with date pickers
 * - Event type dropdown with search
 * - Glowing submit button when form is complete
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X, MapPin, Calendar, Sparkles, Search, Loader2 } from 'lucide-react';
import { usePhotos, CreateEventParams } from '@/context/PhotoContext';
import { EventType } from '@/types';
import EventTypeSelector from './EventTypeSelector';

// Dynamic import for SSR safety
const LocationPickerMap = dynamic(
  () => import('./LocationPickerMap'),
  { ssr: false }
);

export default function CreateEventModal() {
  const { showCreateEventModal, setShowCreateEventModal, createEvent, events } = usePhotos();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('other');
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // UI state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location autocomplete state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for duplicate name
  const isDuplicateName = useMemo(() => {
    if (!name.trim()) return false;
    return events.some(e => e.name.toLowerCase() === name.trim().toLowerCase());
  }, [name, events]);
  
  // Location search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (locationSearch.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    
    setIsSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`
        );
        const data = await res.json();
        setLocationSuggestions(data);
        setShowLocationSuggestions(data.length > 0);
      } catch (error) {
        console.error('Location search failed:', error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearch]);
  
  // Close location dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const parts = suggestion.display_name.split(', ');
    const shortName = parts.slice(0, 2).join(', ');
    setLocationName(shortName);
    setLocationLat(parseFloat(suggestion.lat));
    setLocationLng(parseFloat(suggestion.lon));
    setLocationSearch('');
    setShowLocationSuggestions(false);
  };
  
  // Check if form is complete
  const isFormComplete = useMemo(() => {
    if (!name.trim()) return false;
    if (isDuplicateName) return false;
    if (!startDate) return false;
    if (isMultiDay && !endDate) return false;
    return true;
  }, [name, isDuplicateName, startDate, endDate, isMultiDay]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateEventModal) {
      setName('');
      setDescription('');
      setEventType('other');
      setLocationName('');
      setLocationLat(undefined);
      setLocationLng(undefined);
      setIsMultiDay(false);
      setStartDate('');
      setEndDate('');
    }
  }, [showCreateEventModal]);
  
  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLocationLat(lat);
    setLocationLng(lng);
    // Try reverse geocoding for location name
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          // Extract city/town from the address
          const parts = data.display_name.split(', ');
          setLocationName(parts.slice(0, 2).join(', '));
        }
      })
      .catch(() => {
        setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;
    
    setIsSubmitting(true);
    
    // Small delay for animation satisfaction
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const params: CreateEventParams = {
      name: name.trim(),
      description: description.trim() || undefined,
      eventType,
      locationName: locationName || undefined,
      locationLat,
      locationLng,
      isMultiDay,
      startDate: startDate ? new Date(startDate) : null,
      endDate: isMultiDay && endDate ? new Date(endDate) : null,
    };
    
    createEvent(params);
    setShowCreateEventModal(false);
    setIsSubmitting(false);
  };
  
  if (!showCreateEventModal) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setShowCreateEventModal(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Event
              </h2>
            </div>
            <button
              onClick={() => setShowCreateEventModal(false)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Vacation 2024"
                className={`
                  w-full px-4 py-3 rounded-xl border-2
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2
                  transition-all duration-200
                  ${isDuplicateName 
                    ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500/20'
                  }
                `}
                autoFocus
              />
              {isDuplicateName && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>An event with this name already exists</span>
                </p>
              )}
            </div>
            
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <EventTypeSelector value={eventType} onChange={setEventType} />
            </div>
            
            {/* Location */}
            <div className="relative" ref={locationDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={locationSearch || locationName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocationSearch(value);
                      if (!value) {
                        setLocationName('');
                        setLocationLat(undefined);
                        setLocationLng(undefined);
                      }
                    }}
                    onFocus={() => {
                      if (locationSearch) setShowLocationSuggestions(true);
                    }}
                    placeholder="Search for a location..."
                    className="
                      w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      transition-all duration-200
                    "
                  />
                  {isSearchingLocation && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className={`
                    px-4 py-3 rounded-xl border-2 transition-all duration-200
                    ${locationLat 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700'
                    }
                  `}
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              
              {/* Location suggestions dropdown */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="
                  absolute z-50 left-0 right-12 mt-2 
                  bg-white dark:bg-gray-800 rounded-xl shadow-xl 
                  border border-gray-200 dark:border-gray-700
                  py-2 max-h-64 overflow-y-auto
                ">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLocationSelect(suggestion)}
                      className="
                        w-full px-4 py-3 text-left text-sm
                        hover:bg-gray-50 dark:hover:bg-gray-700
                        flex items-start gap-3 transition-colors
                      "
                    >
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 leading-snug">
                        {suggestion.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              {locationLat && locationLng && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  📍 {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                </p>
              )}
            </div>
            
            {/* Multi-day Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Multi-day Event
              </label>
              <button
                type="button"
                onClick={() => setIsMultiDay(!isMultiDay)}
                className={`
                  relative w-14 h-8 rounded-full transition-colors duration-200
                  ${isMultiDay 
                    ? 'bg-primary-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              >
                <span 
                  className={`
                    absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md
                    transition-transform duration-200
                    ${isMultiDay ? 'translate-x-6' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
            
            {/* Date Picker(s) */}
            <div className={`grid gap-4 ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isMultiDay ? 'Start Date *' : 'Date *'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="
                      w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      transition-all duration-200
                    "
                  />
                </div>
              </div>
              
              {isMultiDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="
                        w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                        transition-all duration-200
                      "
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Description (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some notes about this event..."
                rows={3}
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  transition-all duration-200 resize-none
                "
              />
            </div>
          </form>
          
          {/* Footer with Submit Button */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                ${isFormComplete && !isSubmitting
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 glow-button'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Location Picker Map */}
      {showLocationPicker && (
        <LocationPickerMap
          onSelect={handleMapLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLat={locationLat}
          initialLng={locationLng}
        />
      )}
    </>
  );
}
