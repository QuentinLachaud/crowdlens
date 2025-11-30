/**
 * PeopleTab - People clustering and discovery view.
 * 
 * Features:
 * - List all person clusters across events
 * - Filter by event, claimed status, bib number
 * - Click to view person's photos
 * - Claim clusters and set display names
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  User,
  Search,
  Filter,
  Tag,
  Camera,
  Check,
  X,
  Edit2,
  Loader2,
  ChevronDown,
  Hash,
} from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';
import { api, ApiCluster, ApiPhoto } from '@/services/api';

/** Person cluster with local event info */
interface PersonWithEvent extends ApiCluster {
  eventName?: string;
}

export default function PeopleTab() {
  // Context
  const { events } = usePhotos();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [people, setPeople] = useState<PersonWithEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showClaimedOnly, setShowClaimedOnly] = useState(false);
  
  // Selected person
  const [selectedPerson, setSelectedPerson] = useState<PersonWithEvent | null>(null);
  const [personPhotos, setPersonPhotos] = useState<ApiPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Load clusters from all events
  const loadPeople = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const allPeople: PersonWithEvent[] = [];
    
    try {
      // For each event, fetch clusters
      for (const event of events) {
        try {
          const response = await api.listClusters(event.id);
          const clustersWithEvent = response.clusters.map(c => ({
            ...c,
            eventId: event.id,
            eventName: event.name,
          }));
          allPeople.push(...clustersWithEvent);
        } catch {
          // Skip events that fail
          console.warn(`Failed to load clusters for event ${event.id}`);
        }
      }
      
      setPeople(allPeople);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load people');
    } finally {
      setIsLoading(false);
    }
  }, [events]);

  // Load on mount and when events change
  useEffect(() => {
    if (events.length > 0) {
      loadPeople();
    } else {
      setIsLoading(false);
    }
  }, [events, loadPeople]);

  // Filter people
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      // Event filter
      if (selectedEventId && person.eventId !== selectedEventId) {
        return false;
      }
      
      // Claimed filter
      if (showClaimedOnly && !person.isClaimed) {
        return false;
      }
      
      // Search filter (name, tags, bib)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = person.displayName?.toLowerCase().includes(query);
        const matchesTags = person.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesName && !matchesTags) {
          return false;
        }
      }
      
      return true;
    });
  }, [people, selectedEventId, showClaimedOnly, searchQuery]);

  // Load photos for selected person
  const handleSelectPerson = useCallback(async (person: PersonWithEvent) => {
    setSelectedPerson(person);
    setIsLoadingPhotos(true);
    setEditName(person.displayName || '');
    
    try {
      const response = await api.getClusterPhotos(person.id, 50);
      setPersonPhotos(response.photos);
    } catch {
      setPersonPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Close person detail
  const handleClosePerson = useCallback(() => {
    setSelectedPerson(null);
    setPersonPhotos([]);
    setIsEditing(false);
  }, []);

  // Save name change
  const handleSaveName = useCallback(async () => {
    if (!selectedPerson) return;
    
    try {
      await api.updateCluster(selectedPerson.id, editName);
      
      // Update local state
      setPeople(prev => prev.map(p =>
        p.id === selectedPerson.id ? { ...p, displayName: editName } : p
      ));
      setSelectedPerson(prev => prev ? { ...prev, displayName: editName } : null);
      setIsEditing(false);
    } catch {
      // Ignore errors for now
    }
  }, [selectedPerson, editName]);

  // Claim cluster
  const handleClaim = useCallback(async () => {
    if (!selectedPerson) return;
    
    try {
      await api.claimCluster(selectedPerson.id, editName || undefined);
      
      // Update local state
      setPeople(prev => prev.map(p =>
        p.id === selectedPerson.id ? { ...p, isClaimed: true, displayName: editName } : p
      ));
      setSelectedPerson(prev => prev ? { ...prev, isClaimed: true, displayName: editName } : null);
    } catch {
      // Ignore errors
    }
  }, [selectedPerson, editName]);

  // Stats
  const stats = useMemo(() => ({
    total: people.length,
    claimed: people.filter(p => p.isClaimed).length,
    totalPhotos: people.reduce((sum, p) => sum + p.photoCount, 0),
  }), [people]);

  // Empty state
  if (!isLoading && events.length === 0) {
    return (
      <EmptyState
        title="No Events Yet"
        description="Create an event and upload photos to start discovering people."
        icon={<Users className="w-10 h-10 text-secondary-600 dark:text-secondary-400" />}
      />
    );
  }

  if (!isLoading && people.length === 0) {
    return (
      <EmptyState
        title="No People Found"
        description="Upload photos to events. CrowdLens will automatically detect and group people."
        icon={<Users className="w-10 h-10 text-secondary-600 dark:text-secondary-400" />}
      />
    );
  }

  return (
    <div className="h-full flex">
      {/* Main list */}
      <div className="flex-1 flex flex-col">
        {/* Header & Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{stats.total}</strong> people
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{stats.claimed}</strong> claimed
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{stats.totalPhotos}</strong> photos
            </span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bib number, or tag..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Event filter */}
            <div className="relative">
              <select
                value={selectedEventId || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEventId(e.target.value || null)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Events</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Claimed filter */}
            <button
              onClick={() => setShowClaimedOnly(!showClaimedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showClaimedOnly
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Check className="w-4 h-4" />
              Claimed Only
            </button>
          </div>
        </div>
        
        {/* People grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No people match your filters
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPeople.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  isSelected={selectedPerson?.id === person.id}
                  onClick={() => handleSelectPerson(person)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Person detail panel */}
      {selectedPerson && (
        <PersonDetailPanel
          person={selectedPerson}
          photos={personPhotos}
          isLoading={isLoadingPhotos}
          isEditing={isEditing}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={() => setIsEditing(true)}
          onCancelEdit={() => { setIsEditing(false); setEditName(selectedPerson.displayName || ''); }}
          onSave={handleSaveName}
          onClaim={handleClaim}
          onClose={handleClosePerson}
        />
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/50 dark:to-secondary-800/50 rounded-3xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        {description}
      </p>
    </div>
  );
}

function PersonCard({
  person,
  isSelected,
  onClick,
}: {
  person: PersonWithEvent;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {/* Avatar */}
      <div className="relative mb-3">
        {person.representativeThumbnailUrl ? (
          <img
            src={person.representativeThumbnailUrl}
            alt={person.displayName || 'Person'}
            className="w-full aspect-square rounded-lg object-cover"
          />
        ) : (
          <div className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Claimed badge */}
        {person.isClaimed && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
        {person.displayName || 'Unknown Person'}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {person.eventName}
      </p>
      
      {/* Stats */}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Camera className="w-3 h-3" />
          {person.photoCount}
        </span>
        {person.tags.some(t => t.startsWith('bib:')) && (
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {person.tags.find(t => t.startsWith('bib:'))?.replace('bib:', '')}
          </span>
        )}
      </div>
    </button>
  );
}

function PersonDetailPanel({
  person,
  photos,
  isLoading,
  isEditing,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onClaim,
  onClose,
}: {
  person: PersonWithEvent;
  photos: ApiPhoto[];
  isLoading: boolean;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onClaim: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Person Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Avatar */}
        {person.representativeThumbnailUrl ? (
          <img
            src={person.representativeThumbnailUrl}
            alt={person.displayName || 'Person'}
            className="w-24 h-24 rounded-xl object-cover mx-auto"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-gray-400" />
          </div>
        )}
        
        {/* Name */}
        <div className="mt-4 text-center">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                placeholder="Enter name"
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                autoFocus
              />
              <button
                onClick={onSave}
                className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {person.displayName || 'Unknown Person'}
              </h2>
              <button
                onClick={onStartEdit}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {person.eventName}
          </p>
        </div>
        
        {/* Tags */}
        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-3">
            {person.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Claim button */}
        {!person.isClaimed && (
          <button
            onClick={onClaim}
            className="w-full mt-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            This Is Me
          </button>
        )}
      </div>
      
      {/* Photos */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {person.photoCount} Photos
        </h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.thumbnailUrl}
                alt=""
                className="w-full aspect-square rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
