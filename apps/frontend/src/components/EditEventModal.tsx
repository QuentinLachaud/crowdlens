/**
 * EditEventModal - Edit existing event properties.
 * 
 * Similar to CreateEventModal but pre-populated with existing event data.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { X, MapPin, Calendar, Pencil } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { EventType } from '@/types';
import EventTypeSelector from './EventTypeSelector';

// Dynamic import for SSR safety
const LocationPickerMap = dynamic(
  () => import('./LocationPickerMap'),
  { ssr: false }
);

export default function EditEventModal() {
  const { 
    showEditEventModal, 
    setShowEditEventModal, 
    editingEventId,
    setEditingEventId,
    events,
    updateEvent,
  } = usePhotos();
  
  // Get the event being edited
  const event = useMemo(() => {
    return events.find(e => e.id === editingEventId);
  }, [events, editingEventId]);
  
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
  
  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setName(event.name);
      setDescription(event.description || '');
      setEventType(event.eventType);
      setLocationName(event.locationName || '');
      setLocationLat(event.locationLat);
      setLocationLng(event.locationLng);
      setIsMultiDay(event.isMultiDay);
      setStartDate(event.startDate ? event.startDate.toISOString().split('T')[0] : '');
      setEndDate(event.endDate ? event.endDate.toISOString().split('T')[0] : '');
    }
  }, [event]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!showEditEventModal) {
      setEditingEventId(null);
    }
  }, [showEditEventModal, setEditingEventId]);
  
  // Check if form is complete
  const isFormComplete = useMemo(() => {
    if (!name.trim()) return false;
    return true;
  }, [name]);
  
  const handleLocationSelect = (lat: number, lng: number) => {
    setLocationLat(lat);
    setLocationLng(lng);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          const parts = data.display_name.split(', ');
          setLocationName(parts.slice(0, 2).join(', '));
        }
      })
      .catch(() => {
        setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
  };
  
  const handleClose = () => {
    setShowEditEventModal(false);
    setEditingEventId(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || !editingEventId) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateEvent(editingEventId, {
      name: name.trim(),
      description: description.trim() || undefined,
      eventType,
      locationName: locationName || undefined,
      locationLat,
      locationLng,
      isMultiDay,
      startDate: startDate ? new Date(startDate) : null,
      endDate: isMultiDay && endDate ? new Date(endDate) : null,
    });
    
    handleClose();
    setIsSubmitting(false);
  };
  
  if (!showEditEventModal || !event) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
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
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Event
              </h2>
            </div>
            <button
              onClick={handleClose}
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
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  transition-all duration-200
                "
                autoFocus
              />
            </div>
            
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <EventTypeSelector value={eventType} onChange={setEventType} />
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter address or pick on map"
                  className="
                    flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-all duration-200
                  "
                />
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
                  ${isMultiDay ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span 
                  className={`
                    absolute top-1 w-6 h-6 bg-white rounded-full shadow-md
                    transition-transform duration-200
                    ${isMultiDay ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            
            {/* Date Picker(s) */}
            <div className={`grid gap-4 ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isMultiDay ? 'Start Date' : 'Date'}
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
                    End Date
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
            
            {/* Description */}
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
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                ${isFormComplete && !isSubmitting
                  ? 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/30 hover:shadow-xl hover:shadow-secondary-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Location Picker Map */}
      {showLocationPicker && (
        <LocationPickerMap
          onSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLat={locationLat}
          initialLng={locationLng}
        />
      )}
    </>
  );
}
