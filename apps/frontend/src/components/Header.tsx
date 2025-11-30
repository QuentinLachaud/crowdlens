/**
 * Header - App header with branding, Create Event button, and theme toggle.
 * 
 * Displays the app name, tagline, Create Event button (top-right),
 * and a button to switch between light and dark modes.
 */

'use client';

import { Camera, Moon, Sun, HelpCircle, Plus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { usePhotos } from '@/context/PhotoContext';
import { useState } from 'react';
import HelpPanel from './HelpPanel';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { setShowCreateEventModal } = usePhotos();
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  CrowdLens
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Organize your memories
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Create Event Button */}
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-gradient-to-r from-primary-500 to-primary-600
                  hover:from-primary-600 hover:to-primary-700
                  text-white font-medium text-sm
                  shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35
                  transition-all duration-300 ease-out
                  hover:-translate-y-0.5 active:translate-y-0
                "
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Event</span>
              </button>
              
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
