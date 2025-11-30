/**
 * LoadingSpinner - Satisfying animated loading indicator.
 * 
 * Features:
 * - Smooth spinning animation
 * - Multiple size options
 * - Primary color theming
 * - Optional label text
 */

'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-16 h-16 border-4',
};

export default function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer glow ring */}
        <div 
          className={`
            absolute inset-0 rounded-full
            bg-primary-500/20 blur-md
            animate-pulse
          `}
        />
        
        {/* Main spinner */}
        <div
          className={`
            ${sizeClasses[size]}
            border-primary-200 dark:border-primary-800
            border-t-primary-500
            rounded-full
            animate-spin
            relative
          `}
          style={{ animationDuration: '0.8s' }}
        />
        
        {/* Inner dot for extra polish */}
        {(size === 'lg' || size === 'xl') && (
          <div 
            className="
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-2 h-2 bg-primary-500 rounded-full
              animate-pulse
            "
          />
        )}
      </div>
      
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * FullPageLoader - Full-page loading overlay.
 */
export function FullPageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="xl" label={label} />
    </div>
  );
}

/**
 * InlineLoader - Inline loading indicator for buttons/inputs.
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        style={{ animationDuration: '0.6s' }}
      />
    </div>
  );
}

/**
 * ContentLoader - Skeleton loading placeholder.
 */
export function ContentLoader({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`
            h-4 bg-gray-200 dark:bg-gray-700 rounded-lg
            ${i === lines - 1 ? 'w-2/3' : 'w-full'}
          `}
        />
      ))}
    </div>
  );
}
