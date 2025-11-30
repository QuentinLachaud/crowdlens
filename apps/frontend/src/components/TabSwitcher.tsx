/**
 * TabSwitcher - Navigation between Events, Map, Photos, and People views.
 * 
 * Renders a clean tab bar with smooth transitions between active states.
 * Tab order: Events, Map, Photos, People
 */

'use client';

import { Calendar, Images, Users } from 'lucide-react';
import { ActiveTab } from '@/types';

/** Custom globe/map icon with more visual appeal */
const MapGlobeIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
    <path d="M12 2c-2.5 2.5-4 6.5-4 10s1.5 7.5 4 10" />
    <path d="M12 2c2.5 2.5 4 6.5 4 10s-1.5 7.5-4 10" />
  </svg>
);

interface TabSwitcherProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'map', label: 'Map', icon: MapGlobeIcon },
    { id: 'photos', label: 'Photos', icon: Images },
    { id: 'people', label: 'People', icon: Users },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                  transition-colors duration-200 ease-out
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
