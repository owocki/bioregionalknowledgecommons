'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGlobeStore } from '@/stores/globeStore';

const STORAGE_KEY = 'bkc-user-location';

interface GeolocationResult {
  location: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
}

function getStoredLocation(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        typeof parsed.lat === 'number' &&
        typeof parsed.lng === 'number' &&
        isFinite(parsed.lat) &&
        isFinite(parsed.lng)
      ) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function useGeolocation(): GeolocationResult {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUserLocation = useGlobeStore((s) => s.setUserLocation);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = getStoredLocation();
    if (stored) {
      setLocation(stored);
      setUserLocation(stored.lat, stored.lng);
    }
  }, [setUserLocation]);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        setIsLoading(false);

        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {
          // Storage might be full or unavailable
        }

        // Update global store
        setUserLocation(loc.lat, loc.lng);
      },
      (posError) => {
        setIsLoading(false);
        switch (posError.code) {
          case posError.PERMISSION_DENIED:
            setError(
              'Location access was denied. Please enable location permissions in your browser settings.'
            );
            break;
          case posError.POSITION_UNAVAILABLE:
            setError(
              'Your location could not be determined. Please check your device settings.'
            );
            break;
          case posError.TIMEOUT:
            setError(
              'Location request timed out. Please try again.'
            );
            break;
          default:
            setError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [setUserLocation]);

  return { location, error, isLoading, requestLocation };
}
