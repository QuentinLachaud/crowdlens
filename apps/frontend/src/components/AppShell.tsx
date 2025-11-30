/**
 * AppShell - Main application layout and state management.
 * 
 * Coordinates:
 * - Tab switching between Photos and Map views
 * - Global modal/overlay display (event selector)
 */

'use client';

import { useState } from 'react';
import { ActiveTab } from '@/types';
import Header from './Header';
import TabSwitcher from './TabSwitcher';
import PhotosTab from './PhotosTab';
import MapView from './MapView';
import EventSelector from './EventSelector';

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('photos');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab content with smooth transitions */}
        <div className="animate-fade-in">
          {activeTab === 'photos' ? <PhotosTab /> : <MapView />}
        </div>
      </main>
      
      {/* Global overlays */}
      <EventSelector />
    </div>
  );
}
