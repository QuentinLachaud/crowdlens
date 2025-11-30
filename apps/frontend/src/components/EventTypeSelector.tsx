/**
 * EventTypeSelector - Searchable dropdown for event categories.
 * 
 * Features:
 * - Full list of event types with icons
 * - Text search filtering
 * - Keyboard navigation support
 * - Clean, animated dropdown
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, Search, Check,
  Music, PartyPopper, GraduationCap, Heart, Palmtree, Camera,
  School, Users, Cake, Gift, Briefcase, Trophy, Church, HandHeart,
  Image, Presentation, HelpCircle
} from 'lucide-react';
import { EventType, EVENT_TYPE_LABELS } from '@/types';

/** Icon mapping for event types */
const EVENT_TYPE_ICONS: Record<EventType, React.ElementType> = {
  'concert': Music,
  'festival': PartyPopper,
  'graduation': GraduationCap,
  'wedding': Heart,
  'outing': Palmtree,
  'vacation': Palmtree,
  'tourist-attraction': Camera,
  'school-trip': School,
  'get-together': Users,
  'birthday': Cake,
  'anniversary': Gift,
  'corporate': Briefcase,
  'sports': Trophy,
  'religious': Church,
  'charity': HandHeart,
  'exhibition': Image,
  'conference': Presentation,
  'other': HelpCircle,
};

interface EventTypeSelectorProps {
  value: EventType;
  onChange: (value: EventType) => void;
}

export default function EventTypeSelector({ value, onChange }: EventTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // All event types as array
  const allTypes = Object.keys(EVENT_TYPE_LABELS) as EventType[];
  
  // Filter by search
  const filteredTypes = allTypes.filter(type => 
    EVENT_TYPE_LABELS[type].toLowerCase().includes(search.toLowerCase())
  );
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSelect = (type: EventType) => {
    onChange(type);
    setIsOpen(false);
    setSearch('');
  };
  
  const SelectedIcon = EVENT_TYPE_ICONS[value];
  
  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2
          bg-white dark:bg-gray-800 text-left transition-all duration-200
          ${isOpen 
            ? 'border-primary-500 ring-2 ring-primary-500/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
      >
        <SelectedIcon className="w-5 h-5 text-primary-500" />
        <span className="flex-1 text-gray-900 dark:text-white font-medium">
          {EVENT_TYPE_LABELS[value]}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event types..."
                className="
                  w-full pl-10 pr-4 py-2 rounded-lg
                  bg-gray-50 dark:bg-gray-900 
                  border border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-white text-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                "
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="max-h-64 overflow-y-auto py-2">
            {filteredTypes.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No matching event types
              </div>
            ) : (
              filteredTypes.map(type => {
                const Icon = EVENT_TYPE_ICONS[type];
                const isSelected = type === value;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelect(type)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-colors
                      ${isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="flex-1 text-sm font-medium">
                      {EVENT_TYPE_LABELS[type]}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
