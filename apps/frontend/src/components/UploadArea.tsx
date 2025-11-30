/**
 * UploadArea - Drag-and-drop file upload component.
 * 
 * Provides a visually appealing drop zone for photo uploads with:
 * - Drag-and-drop support
 * - Click to browse functionality
 * - Directory upload support (where available)
 * - Visual feedback during drag operations
 * - File validation for image types
 */

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePhotos } from '@/context/PhotoContext';

export default function UploadArea() {
  const { uploadState, uploadProgress, setPendingFiles, pendingFiles } = usePhotos();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Handle drag events
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles(files);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles(files);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };
  
  // Click handlers for buttons
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };
  
  // Render different states
  if (uploadState === 'processing') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary-200 dark:border-primary-800 p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Processing photos...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {uploadProgress.processed} of {uploadProgress.total} photos processed
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300 ease-out"
              style={{ width: `${(uploadProgress.processed / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (uploadState === 'success') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-green-200 dark:border-green-800 p-8 text-center animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Upload complete!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {uploadProgress.total} photos added successfully
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (uploadState === 'error') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-800 p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Upload failed
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Something went wrong. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Default idle state
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed 
        transition-all duration-200 ease-out p-8
        ${isDragging 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' 
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }
      `}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Icon */}
        <div className={`
          w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-200
          ${isDragging 
            ? 'bg-primary-200 dark:bg-primary-800' 
            : 'bg-gray-100 dark:bg-gray-700'
          }
        `}>
          {isDragging ? (
            <ImagePlus className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        
        {/* Text */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {isDragging ? 'Drop your photos here' : 'Upload your photos'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag and drop photos here, or click below to browse
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            onClick={handleBrowseClick}
            className="
              px-6 py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700
              text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25
              transition-all duration-200 ease-out
              hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5
              active:translate-y-0 active:shadow-md
            "
          >
            Browse Files
          </button>
          <button
            onClick={handleFolderClick}
            className="
              px-6 py-3 bg-white dark:bg-gray-700 
              text-gray-700 dark:text-gray-200 font-semibold 
              rounded-xl border border-gray-300 dark:border-gray-600
              transition-all duration-200 ease-out
              hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            Upload Folder
          </button>
        </div>
        
        {/* Supported formats */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Supports JPEG, PNG, HEIC, WebP
        </p>
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        multiple
        // @ts-expect-error - webkitdirectory is a non-standard attribute
        webkitdirectory=""
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
