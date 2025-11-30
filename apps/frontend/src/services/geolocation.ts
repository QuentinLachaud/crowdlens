/**
 * Geolocation service.
 * 
 * Provides user location via multiple fallback strategies:
 * 1. Browser Geolocation API (most accurate)
 * 2. IP-based geolocation via free API (fallback)
 * 3. Default location (Paris) if all else fails
 */

import { UserLocation } from '@/types';

/** Default fallback location (Paris, France) */
const DEFAULT_LOCATION: UserLocation = {
  lat: 48.8566,
  lng: 2.3522,
  source: 'default',
};

/** Cache key for localStorage */
const LOCATION_CACHE_KEY = 'crowdlens_user_location';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CachedLocation {
  location: UserLocation;
  timestamp: number;
}

/**
 * Get cached location if still valid.
 */
function getCachedLocation(): UserLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!stored) return null;
    
    const cached: CachedLocation = JSON.parse(stored);
    const age = Date.now() - cached.timestamp;
    
    if (age < CACHE_DURATION_MS) {
      return cached.location;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache location for quick subsequent loads.
 */
function cacheLocation(location: UserLocation): void {
  try {
    const cached: CachedLocation = {
      location,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get location via browser Geolocation API.
 * Requires user permission.
 */
async function getGPSLocation(): Promise<UserLocation | null> {
  if (!navigator.geolocation) return null;
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: CACHE_DURATION_MS,
      }
    );
  });
}

/**
 * Get location via IP-based geolocation API.
 * Uses free ip-api.com service.
 */
async function getIPLocation(): Promise<UserLocation | null> {
  try {
    const response = await fetch('https://ip-api.com/json/?fields=lat,lon,status', {
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status !== 'success') return null;
    
    return {
      lat: data.lat,
      lng: data.lon,
      source: 'ip',
    };
  } catch {
    return null;
  }
}

/**
 * Get user's current location using available methods.
 * 
 * Strategy:
 * 1. Return cached location if recent
 * 2. Try GPS (with user permission)
 * 3. Fall back to IP-based location
 * 4. Return default location as last resort
 */
export async function getUserLocation(): Promise<UserLocation> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) return cached;
  
  // Try GPS first (most accurate)
  const gpsLocation = await getGPSLocation();
  if (gpsLocation) {
    cacheLocation(gpsLocation);
    return gpsLocation;
  }
  
  // Fall back to IP-based location
  const ipLocation = await getIPLocation();
  if (ipLocation) {
    cacheLocation(ipLocation);
    return ipLocation;
  }
  
  // Return default as last resort
  return DEFAULT_LOCATION;
}

/**
 * Calculate zoom level for a given view width in km.
 * Leaflet zoom levels: 0 = world, 18 = building level
 */
export function getZoomForWidth(widthKm: number): number {
  // Approximate: zoom 0 shows ~40000km, each level halves the width
  // widthKm = 40000 / 2^zoom
  // zoom = log2(40000 / widthKm)
  const zoom = Math.log2(40000 / widthKm);
  return Math.min(18, Math.max(1, Math.round(zoom)));
}

/**
 * Calculate appropriate zoom for ~5000km view width.
 * This gives a good overview of a continent-sized area.
 */
export const DEFAULT_ZOOM = getZoomForWidth(5000); // ~3
