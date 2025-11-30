/**
 * usePhotoUpload Hook
 * 
 * Manages photo upload workflow with progress tracking,
 * EXIF extraction, and API integration.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { api, PhotoUploadMetadata, PhotoUploadResult } from '@/services/api';
import { extractExifData } from '@/utils/exif';

/** Upload state machine */
export type UploadStatus = 
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

/** Individual file status */
export interface FileUploadStatus {
  file: File;
  status: 'pending' | 'extracting' | 'uploading' | 'done' | 'error';
  progress: number;
  photoId?: string;
  thumbnailUrl?: string;
  error?: string;
}

/** Upload hook state */
export interface UsePhotoUploadState {
  status: UploadStatus;
  files: FileUploadStatus[];
  totalProgress: number;
  uploadedCount: number;
  failedCount: number;
  error: string | null;
}

/** Upload hook actions */
export interface UsePhotoUploadActions {
  /** Start upload for selected files */
  uploadFiles: (files: File[], eventId: string) => Promise<PhotoUploadResult[]>;
  /** Cancel ongoing upload */
  cancel: () => void;
  /** Reset state */
  reset: () => void;
  /** Add more files to pending */
  addFiles: (files: File[]) => void;
  /** Remove a file from pending */
  removeFile: (index: number) => void;
}

const initialState: UsePhotoUploadState = {
  status: 'idle',
  files: [],
  totalProgress: 0,
  uploadedCount: 0,
  failedCount: 0,
  error: null,
};

/**
 * Hook for managing photo uploads with progress tracking.
 */
export function usePhotoUpload(): [UsePhotoUploadState, UsePhotoUploadActions] {
  const [state, setState] = useState<UsePhotoUploadState>(initialState);
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setState(initialState);
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState(prev => ({
      ...prev,
      status: 'idle',
      error: 'Upload cancelled',
    }));
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newFiles: FileUploadStatus[] = files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));
  }, []);

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  }, []);

  const uploadFiles = useCallback(async (
    files: File[],
    eventId: string
  ): Promise<PhotoUploadResult[]> => {
    if (files.length === 0) {
      return [];
    }

    cancelledRef.current = false;

    // Initialize file statuses
    const fileStatuses: FileUploadStatus[] = files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setState({
      status: 'preparing',
      files: fileStatuses,
      totalProgress: 0,
      uploadedCount: 0,
      failedCount: 0,
      error: null,
    });

    // Extract EXIF metadata for all files
    const metadata: PhotoUploadMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      if (cancelledRef.current) {
        return [];
      }

      const file = files[i];
      
      // Update status
      setState(prev => ({
        ...prev,
        files: prev.files.map((f, idx) =>
          idx === i ? { ...f, status: 'extracting' } : f
        ),
        totalProgress: (i / files.length) * 20, // First 20% is metadata extraction
      }));

      try {
        const exif = await extractExifData(file);
        
        metadata.push({
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
          exifTakenAt: exif.takenAt?.toISOString(),
          geo: exif.gpsLat && exif.gpsLng
            ? { lat: exif.gpsLat, lng: exif.gpsLng }
            : undefined,
          cameraMake: exif.cameraMake,
          cameraModel: exif.cameraModel,
          width: exif.width,
          height: exif.height,
        });
      } catch {
        // If EXIF extraction fails, use basic metadata
        metadata.push({
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
        });
      }
    }

    if (cancelledRef.current) {
      return [];
    }

    // Update status to uploading
    setState(prev => ({
      ...prev,
      status: 'uploading',
      files: prev.files.map(f => ({ ...f, status: 'uploading' })),
      totalProgress: 20,
    }));

    try {
      // Upload to API
      const response = await api.uploadPhotos(eventId, files, metadata);

      if (cancelledRef.current) {
        return [];
      }

      // Update with results
      const uploadedCount = response.photos.filter(p => p.status === 'uploaded').length;
      const failedCount = response.photos.filter(p => p.status === 'error').length;

      const updatedFiles = files.map((file, i) => {
        const result = response.photos[i];
        return {
          file,
          status: result?.status === 'uploaded' ? 'done' : 'error',
          progress: 100,
          photoId: result?.photoId,
          thumbnailUrl: result?.thumbnailUrl,
          error: result?.error,
        } as FileUploadStatus;
      });

      setState({
        status: failedCount === files.length ? 'error' : 'success',
        files: updatedFiles,
        totalProgress: 100,
        uploadedCount,
        failedCount,
        error: failedCount > 0 ? `${failedCount} file(s) failed to upload` : null,
      });

      return response.photos;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: message,
        files: prev.files.map(f => ({
          ...f,
          status: 'error',
          error: message,
        })),
      }));

      return [];
    }
  }, []);

  return [
    state,
    { uploadFiles, cancel, reset, addFiles, removeFile },
  ];
}

/**
 * Hook for single file upload (e.g., selfie for face search).
 */
export function useSingleFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setIsProcessing(false);
  }, []);

  return {
    file,
    preview,
    isProcessing,
    selectFile,
    clear,
  };
}
