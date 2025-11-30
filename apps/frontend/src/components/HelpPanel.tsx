/**
 * HelpPanel - Slide-out panel explaining app features and metadata handling.
 * 
 * Provides users with information about:
 * - How to upload photos
 * - What EXIF metadata is extracted
 * - How the map view works
 */

'use client';

import { X, Camera, MapPin, Calendar, Folder } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-up overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              How CrowdLens Works
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            {/* Upload section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Camera className="w-5 h-5" />
                <h3 className="font-semibold">Uploading Photos</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag and drop photos onto the upload area, or click to browse your files. 
                You can select multiple photos at once, or even entire folders if your browser supports it.
              </p>
            </section>
            
            {/* Events section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Folder className="w-5 h-5" />
                <h3 className="font-semibold">Events (Folders)</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organize your photos into events—like "Summer Vacation 2024" or "Sarah's Birthday". 
                Each time you upload, you can choose an existing event or create a new one.
              </p>
            </section>
            
            {/* Metadata section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Calendar className="w-5 h-5" />
                <h3 className="font-semibold">Photo Metadata</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We automatically extract information from your photos:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                <li><strong>Date taken</strong> — when the photo was captured</li>
                <li><strong>GPS location</strong> — where the photo was taken</li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                If your photos don't have this metadata, they'll still work fine—they just won't appear on the map, 
                and we'll use the upload time instead of the capture time.
              </p>
            </section>
            
            {/* Map section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold">Map View</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The Map tab shows all your photos with GPS data on a world map. 
                Photos taken in the same location are grouped together. 
                Click on a marker to see the photo and details.
              </p>
            </section>
            
            {/* Privacy note */}
            <section className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔒 Privacy Note
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All your photos are stored locally in your browser. 
                Nothing is uploaded to any server—your memories stay private.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
