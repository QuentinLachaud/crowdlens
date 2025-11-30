/**
 * PeopleTab - People view placeholder.
 * 
 * Future feature: Face recognition and people tagging.
 */

'use client';

import { Users, Sparkles } from 'lucide-react';

export default function PeopleTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/50 dark:to-secondary-800/50 rounded-3xl flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-secondary-600 dark:text-secondary-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        People
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        Automatically recognize and tag people in your photos. 
        Group photos by person and easily find pictures of friends and family.
      </p>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary-50 dark:bg-secondary-900/30 rounded-full text-secondary-600 dark:text-secondary-400 text-sm font-medium">
        <Sparkles className="w-4 h-4" />
        <span>Coming Soon</span>
      </div>
    </div>
  );
}
