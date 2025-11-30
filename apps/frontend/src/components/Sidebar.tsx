/**
 * Sidebar - Left navigation tray with event creation.
 * 
 * Features:
 * - Minimalist design
 * - Prominent "Add Event" button with plus icon
 * - Event list quick access
 * - Collapsible on mobile
 */

'use client';

import { Plus, Calendar, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { usePhotos } from '@/context/PhotoContext';
import { EVENT_TYPE_LABELS } from '@/types';
import { formatDate, getCoverPhoto } from '@/utils/helpers';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { events, photos, setShowCreateEventModal, setSelectedEventId } = usePhotos();
  
  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.startDate || a.createdAt;
    const dateB = b.startDate || b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });
  
  return (
    <aside 
      className={`
        fixed left-0 top-16 bottom-0 z-30
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="
          absolute -right-3 top-6 z-40
          w-6 h-6 bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 rounded-full
          flex items-center justify-center
          text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          shadow-sm hover:shadow transition-all
        "
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
      
      <div className="h-full flex flex-col p-4">
        {/* Add Event Button */}
        <button
          onClick={() => setShowCreateEventModal(true)}
          className={`
            group relative overflow-hidden
            bg-gradient-to-r from-primary-500 to-primary-600
            hover:from-primary-600 hover:to-primary-700
            text-white font-semibold rounded-xl
            shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35
            transition-all duration-300 ease-out
            hover:-translate-y-0.5 active:translate-y-0
            ${isCollapsed ? 'w-10 h-10 p-0 mx-auto' : 'w-full py-4 px-4'}
          `}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
          
          {isCollapsed ? (
            <Plus className="w-5 h-5 mx-auto relative z-10" />
          ) : (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </span>
          )}
        </button>
        
        {/* Events List */}
        {!isCollapsed && (
          <div className="mt-6 flex-1 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Recent Events
            </h3>
            
            {sortedEvents.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No events yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 -mr-1">
                {sortedEvents.slice(0, 10).map(event => {
                  const eventPhotos = photos.filter(p => p.eventId === event.id);
                  const coverPhoto = getCoverPhoto(eventPhotos);
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className="
                        w-full flex items-center gap-3 p-3 rounded-xl
                        hover:bg-gray-50 dark:hover:bg-gray-800
                        transition-colors text-left group
                      "
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        {coverPhoto ? (
                          <img 
                            src={coverPhoto.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : event.locationLat && event.locationLng ? (
                          <div className="w-full h-full bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {event.startDate ? formatDate(event.startDate) : EVENT_TYPE_LABELS[event.eventType]}
                        </p>
                      </div>
                      
                      {/* Photo count */}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {eventPhotos.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Collapsed state - icon buttons for recent events */}
        {isCollapsed && events.length > 0 && (
          <div className="mt-6 space-y-2 flex-1">
            {sortedEvents.slice(0, 5).map(event => {
              const eventPhotos = photos.filter(p => p.eventId === event.id);
              const coverPhoto = getCoverPhoto(eventPhotos);
              
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className="
                    w-10 h-10 mx-auto rounded-lg overflow-hidden
                    hover:ring-2 hover:ring-primary-500 transition-all
                    bg-gray-100 dark:bg-gray-800
                  "
                  title={event.name}
                >
                  {coverPhoto ? (
                    <img 
                      src={coverPhoto.thumbnailUrl} 
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
