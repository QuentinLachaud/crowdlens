/**
 * AppShell - Main application layout with sidebar navigation.
 * 
 * Structure:
 * - Fixed header at top with Create Event button
 * - Collapsible sidebar on left
 * - Main content area that shifts with sidebar
 * - Global modals (event selector, create event)
 */

'use client';

import { useState } from 'react';
import { ActiveTab } from '@/types';
import Header from './Header';
import TabSwitcher from './TabSwitcher';
import Sidebar from './Sidebar';
import PhotosTab from './PhotosTab';
import MapView from './MapView';
import EventsTab from './EventsTab';
import PeopleTab from './PeopleTab';
import EventSelector from './EventSelector';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('events');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Collapse sidebar when tab is changed
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarCollapsed(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      {/* Sidebar - hover to expand, leave to collapse */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onExpand={() => setSidebarCollapsed(false)}
        onCollapse={() => setSidebarCollapsed(true)}
        onEventSelect={(eventId) => {
          setActiveTab('events');
          setSidebarCollapsed(true);
        }}
      />
      
      {/* Tab Switcher - also shifts with sidebar */}
      <div 
        className={`
          transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'ml-16' : 'ml-72'}
        `}
      >
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      
      {/* Main content with sidebar offset */}
      <main 
        className={`
          transition-all duration-300 ease-out pt-8 pb-8 px-4 sm:px-6 lg:px-8
          ${sidebarCollapsed ? 'ml-16' : 'ml-72'}
        `}
      >
        <div className="max-w-6xl mx-auto animate-fade-in">
          {activeTab === 'events' && <EventsTab />}
          {activeTab === 'map' && (
            <MapView 
              onEventClick={() => setActiveTab('events')}
            />
          )}
          {activeTab === 'photos' && <PhotosTab />}
          {activeTab === 'people' && <PeopleTab />}
        </div>
      </main>
      
      {/* Global modals */}
      <EventSelector />
      <CreateEventModal />
      <EditEventModal />
    </div>
  );
}
