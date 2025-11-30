/**
 * FindYourselfModal - Multi-step wizard for finding yourself in event photos.
 * 
 * Features:
 * - Search by selfie (face recognition)
 * - Search by bib/jersey number
 * - Search by clothing attributes
 * - Results display with cluster selection
 * - Download basket for selected photos
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Hash,
  Shirt,
  ArrowLeft,
  ArrowRight,
  Search,
  Download,
  Check,
  Upload,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api, ClusterSearchResult, ClothingColor, ApiPhoto } from '@/services/api';
import { useSingleFileUpload } from '@/hooks/usePhotoUpload';

// ============================================
// Types
// ============================================

type SearchMethod = 'selfie' | 'bib' | 'clothing';
type Step = 'method' | 'search' | 'results' | 'download';

interface FindYourselfModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// Color Options
// ============================================

const CLOTHING_COLORS: { value: ClothingColor; label: string; className: string }[] = [
  { value: 'red', label: 'Red', className: 'bg-red-500' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', className: 'bg-yellow-400' },
  { value: 'green', label: 'Green', className: 'bg-green-500' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', className: 'bg-pink-400' },
  { value: 'brown', label: 'Brown', className: 'bg-amber-700' },
  { value: 'black', label: 'Black', className: 'bg-gray-900' },
  { value: 'white', label: 'White', className: 'bg-white border border-gray-300' },
  { value: 'gray', label: 'Gray', className: 'bg-gray-500' },
  { value: 'navy', label: 'Navy', className: 'bg-blue-900' },
];

// ============================================
// Main Component
// ============================================

export default function FindYourselfModal({
  eventId,
  eventName,
  isOpen,
  onClose,
}: FindYourselfModalProps) {
  // State
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<SearchMethod | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ClusterSearchResult[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  
  // Selfie search
  const selfie = useSingleFileUpload();
  
  // Bib search
  const [bibNumber, setBibNumber] = useState('');
  
  // Clothing search
  const [primaryColor, setPrimaryColor] = useState<ClothingColor | null>(null);
  const [clothingDescriptor, setClothingDescriptor] = useState('');

  // Reset state when closing
  const handleClose = useCallback(() => {
    setStep('method');
    setMethod(null);
    setIsSearching(false);
    setSearchError(null);
    setResults([]);
    setSelectedPhotos(new Set());
    selfie.clear();
    setBibNumber('');
    setPrimaryColor(null);
    setClothingDescriptor('');
    onClose();
  }, [onClose, selfie]);

  // Method selection
  const handleMethodSelect = useCallback((selectedMethod: SearchMethod) => {
    setMethod(selectedMethod);
    setStep('search');
  }, []);

  // Go back
  const handleBack = useCallback(() => {
    if (step === 'search') {
      setStep('method');
      setSearchError(null);
    } else if (step === 'results') {
      setStep('search');
    } else if (step === 'download') {
      setStep('results');
    }
  }, [step]);

  // Perform search
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);

    try {
      let response: { clusters: ClusterSearchResult[] };

      switch (method) {
        case 'selfie':
          if (!selfie.preview) {
            throw new Error('Please select a selfie image');
          }
          response = await api.searchByFace(eventId, selfie.preview);
          break;

        case 'bib':
          if (!bibNumber.trim()) {
            throw new Error('Please enter a bib number');
          }
          response = await api.searchByBib(eventId, bibNumber.trim());
          break;

        case 'clothing':
          if (!primaryColor && !clothingDescriptor.trim()) {
            throw new Error('Please select a color or enter a description');
          }
          response = await api.searchByClothing(eventId, {
            primaryColor: primaryColor ?? undefined,
            descriptor: clothingDescriptor.trim() || undefined,
          });
          break;

        default:
          throw new Error('Invalid search method');
      }

      setResults(response.clusters);
      setStep('results');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [method, eventId, selfie.preview, bibNumber, primaryColor, clothingDescriptor]);

  // Toggle photo selection
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  // Select all photos in a cluster
  const selectAllInCluster = useCallback((cluster: ClusterSearchResult) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      cluster.matchingPhotos.forEach(p => next.add(p.photoId));
      return next;
    });
  }, []);

  // Total photos found
  const totalPhotosFound = useMemo(() => {
    return results.reduce((sum, r) => sum + r.totalPhotoCount, 0);
  }, [results]);

  // Use portal to render at body level (avoids overflow:hidden issues)
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {step !== 'method' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Find Yourself
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {eventName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'method' && (
              <MethodStep onSelect={handleMethodSelect} />
            )}
            
            {step === 'search' && method === 'selfie' && (
              <SelfieSearchStep
                selfie={selfie}
                isSearching={isSearching}
                error={searchError}
                onSearch={handleSearch}
              />
            )}
            
            {step === 'search' && method === 'bib' && (
              <BibSearchStep
                bibNumber={bibNumber}
                onBibChange={setBibNumber}
                isSearching={isSearching}
                error={searchError}
                onSearch={handleSearch}
              />
            )}
            
            {step === 'search' && method === 'clothing' && (
              <ClothingSearchStep
                primaryColor={primaryColor}
                onColorChange={setPrimaryColor}
                descriptor={clothingDescriptor}
                onDescriptorChange={setClothingDescriptor}
                isSearching={isSearching}
                error={searchError}
                onSearch={handleSearch}
              />
            )}
            
            {step === 'results' && (
              <ResultsStep
                results={results}
                selectedPhotos={selectedPhotos}
                onTogglePhoto={togglePhotoSelection}
                onSelectAllInCluster={selectAllInCluster}
                totalFound={totalPhotosFound}
              />
            )}
          </div>

          {/* Footer */}
          {step === 'results' && selectedPhotos.size > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setStep('download')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render via portal to escape overflow:hidden containers
  return createPortal(modalContent, document.body);
}

// ============================================
// Step Components
// ============================================

function MethodStep({ onSelect }: { onSelect: (method: SearchMethod) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Choose how you want to find yourself in the photos
      </p>
      
      <button
        onClick={() => onSelect('selfie')}
        className="w-full p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
      >
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Camera className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="text-left">
          <h3 className="font-medium text-gray-900 dark:text-white">Use a Selfie</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a photo of yourself for face matching
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
      
      <button
        onClick={() => onSelect('bib')}
        className="w-full p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
      >
        <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Hash className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
        </div>
        <div className="text-left">
          <h3 className="font-medium text-gray-900 dark:text-white">Bib Number</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search by your race or jersey number
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
      
      <button
        onClick={() => onSelect('clothing')}
        className="w-full p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
      >
        <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Shirt className="w-6 h-6 text-accent-600 dark:text-accent-400" />
        </div>
        <div className="text-left">
          <h3 className="font-medium text-gray-900 dark:text-white">Clothing</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filter by clothing color or description
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
      </button>
    </div>
  );
}

function SelfieSearchStep({
  selfie,
  isSearching,
  error,
  onSearch,
}: {
  selfie: ReturnType<typeof useSingleFileUpload>;
  isSearching: boolean;
  error: string | null;
  onSearch: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Upload a Selfie
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a clear photo of your face for matching
        </p>
      </div>
      
      {selfie.preview ? (
        <div className="relative mx-auto w-48 h-48">
          <img
            src={selfie.preview}
            alt="Selfie preview"
            className="w-full h-full object-cover rounded-xl"
          />
          <button
            onClick={selfie.clear}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="block mx-auto w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) selfie.selectFile(file);
            }}
          />
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm">Click to upload</span>
          </div>
        </label>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <button
        onClick={onSearch}
        disabled={!selfie.preview || isSearching}
        className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Matches
          </>
        )}
      </button>
    </div>
  );
}

function BibSearchStep({
  bibNumber,
  onBibChange,
  isSearching,
  error,
  onSearch,
}: {
  bibNumber: string;
  onBibChange: (value: string) => void;
  isSearching: boolean;
  error: string | null;
  onSearch: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Enter Bib Number
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Find photos by your race or jersey number
        </p>
      </div>
      
      <input
        type="text"
        value={bibNumber}
        onChange={(e) => onBibChange(e.target.value)}
        placeholder="e.g., 1427"
        className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && bibNumber.trim()) {
            onSearch();
          }
        }}
      />
      
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <button
        onClick={onSearch}
        disabled={!bibNumber.trim() || isSearching}
        className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Matches
          </>
        )}
      </button>
    </div>
  );
}

function ClothingSearchStep({
  primaryColor,
  onColorChange,
  descriptor,
  onDescriptorChange,
  isSearching,
  error,
  onSearch,
}: {
  primaryColor: ClothingColor | null;
  onColorChange: (color: ClothingColor | null) => void;
  descriptor: string;
  onDescriptorChange: (value: string) => void;
  isSearching: boolean;
  error: string | null;
  onSearch: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Filter by Clothing
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a color or describe what you were wearing
        </p>
      </div>
      
      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Primary Color
        </label>
        <div className="flex flex-wrap gap-2">
          {CLOTHING_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(
                primaryColor === color.value ? null : color.value
              )}
              className={`w-10 h-10 rounded-full ${color.className} ${
                primaryColor === color.value
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                  : ''
              } transition-all hover:scale-110`}
              title={color.label}
            >
              {primaryColor === color.value && (
                <Check className={`w-5 h-5 mx-auto ${
                  color.value === 'white' || color.value === 'yellow'
                    ? 'text-gray-900'
                    : 'text-white'
                }`} />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Descriptor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (optional)
        </label>
        <input
          type="text"
          value={descriptor}
          onChange={(e) => onDescriptorChange(e.target.value)}
          placeholder="e.g., red jacket, blue shorts"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <button
        onClick={onSearch}
        disabled={(!primaryColor && !descriptor.trim()) || isSearching}
        className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Matches
          </>
        )}
      </button>
    </div>
  );
}

function ResultsStep({
  results,
  selectedPhotos,
  onTogglePhoto,
  onSelectAllInCluster,
  totalFound,
}: {
  results: ClusterSearchResult[];
  selectedPhotos: Set<string>;
  onTogglePhoto: (photoId: string) => void;
  onSelectAllInCluster: (cluster: ClusterSearchResult) => void;
  totalFound: number;
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Matches Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search criteria or upload a clearer photo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full mb-2">
          <Check className="w-4 h-4" />
          Found {totalFound} photo{totalFound !== 1 ? 's' : ''} in {results.length} group{results.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {results.map((result, index) => (
        <div
          key={result.cluster.id}
          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        >
          {/* Cluster header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              {result.cluster.representativeThumbnailUrl ? (
                <img
                  src={result.cluster.representativeThumbnailUrl}
                  alt="Person"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {result.cluster.displayName || `Person ${index + 1}`}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {result.totalPhotoCount} photo{result.totalPhotoCount !== 1 ? 's' : ''} • 
                  {Math.round(result.similarity * 100)}% match
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectAllInCluster(result)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Select All
            </button>
          </div>
          
          {/* Tags */}
          {result.cluster.tags.length > 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-1">
              {result.cluster.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Photos grid */}
          <div className="p-4 grid grid-cols-5 gap-2">
            {result.matchingPhotos.map((photo) => (
              <button
                key={photo.photoId}
                onClick={() => onTogglePhoto(photo.photoId)}
                className={`relative aspect-square rounded-lg overflow-hidden ${
                  selectedPhotos.has(photo.photoId)
                    ? 'ring-2 ring-primary-500'
                    : ''
                }`}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {selectedPhotos.has(photo.photoId) && (
                  <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
