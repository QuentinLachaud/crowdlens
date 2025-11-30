/**
 * ConfirmDeleteModal - Gentle confirmation popup for delete actions.
 * 
 * Features:
 * - Soft warning with friendly tone
 * - Clear cancel button (more prominent)
 * - Smooth animations
 * - Customizable title and message
 */

'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: 'photo' | 'photos' | 'event' | 'events';
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType = 'photo',
}: ConfirmDeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Focus cancel button when modal opens
  useEffect(() => {
    if (isOpen && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const defaultTitle = itemType === 'photos' || itemType === 'events'
    ? `Delete ${itemType}?`
    : `Delete this ${itemType}?`;
  
  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : `Are you sure? This action cannot be undone.`;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="
            bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md 
            pointer-events-auto animate-scale-in
            border border-gray-200 dark:border-gray-700
          "
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-4">
            {/* Warning icon */}
            <div className="
              flex-shrink-0 w-12 h-12 rounded-full 
              bg-amber-100 dark:bg-amber-900/30 
              flex items-center justify-center
            ">
              <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title || defaultTitle}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {message || defaultMessage}
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="
                flex-shrink-0 p-1.5 rounded-lg 
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 p-6 pt-4">
            {/* Cancel button - more prominent */}
            <button
              ref={cancelRef}
              onClick={onClose}
              className="
                flex-1 px-4 py-3 rounded-xl font-medium
                bg-gray-100 dark:bg-gray-700 
                text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 
                dark:focus:ring-offset-gray-800
                transition-all duration-200
              "
            >
              Cancel
            </button>
            
            {/* Delete button - less prominent but clear */}
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="
                flex-1 px-4 py-3 rounded-xl font-medium
                bg-red-500 text-white
                hover:bg-red-600
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                dark:focus:ring-offset-gray-800
                transition-all duration-200
              "
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
