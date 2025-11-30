/**
 * PhotoFilters - Search and filter controls for the photos view.
 * 
 * Provides:
 * - Search input for filtering by event name
 * - Year filter dropdown
 */

'use client';

import { Search, X, ChevronDown } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { getYearsFromPhotos } from '@/utils/helpers';
import { useMemo, useState, useRef, useEffect } from 'react';

export default function PhotoFilters() {
  const { photos, photoFilters, setPhotoFilters } = usePhotos();
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const years = useMemo(() => getYearsFromPhotos(photos), [photos]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const clearFilters = () => {
    setPhotoFilters({ searchQuery: '', selectedYear: null });
  };
  
  const hasFilters = photoFilters.searchQuery || photoFilters.selectedYear;
  
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={photoFilters.searchQuery}
          onChange={e => setPhotoFilters({ searchQuery: e.target.value })}
          className="
            w-full pl-10 pr-4 py-2.5 rounded-xl
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
          "
        />
      </div>
      
      {/* Year filter */}
      {years.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              border transition-all duration-200
              ${photoFilters.selectedYear
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }
              hover:border-primary-400 dark:hover:border-primary-600
            `}
          >
            <span>{photoFilters.selectedYear || 'All years'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showYearDropdown && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 animate-fade-in">
              <button
                onClick={() => {
                  setPhotoFilters({ selectedYear: null });
                  setShowYearDropdown(false);
                }}
                className={`
                  w-full px-4 py-2 text-left text-sm transition-colors
                  ${!photoFilters.selectedYear
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                All years
              </button>
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    setPhotoFilters({ selectedYear: year });
                    setShowYearDropdown(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    ${photoFilters.selectedYear === year
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="
            flex items-center gap-1 px-3 py-2 text-sm
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            transition-colors
          "
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
