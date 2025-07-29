import { useState, useEffect, useCallback } from 'react';
import { Location } from '../types';

/**
 * Custom hook for managing geolocation with real-time updates
 * Handles permission requests, error states, and continuous position tracking
 */
export const useGeolocation = (enableHighAccuracy = true, maxAge = 10000) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: maxAge,
    };

    const onSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      
      // Update heading if available
      if (position.coords.heading !== null) {
        setHeading(position.coords.heading);
      }
      
      setError(null);
      setLoading(false);
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown location error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      setError(errorMessage);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, [enableHighAccuracy, maxAge]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) return null;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 15000,
      maximumAge: 5000,
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        if (position.coords.heading !== null) {
          setHeading(position.coords.heading);
        }
        
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Position watch error:', error);
      },
      options
    );
  }, [enableHighAccuracy, maxAge]);

  useEffect(() => {
    getCurrentPosition();
    const watchId = watchPosition();

    // Listen for device orientation changes for compass heading
    const handleOrientationChange = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // Convert to compass bearing (0° = North)
        const compassHeading = (360 - event.alpha) % 360;
        setHeading(compassHeading);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientationChange);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      window.removeEventListener('deviceorientation', handleOrientationChange);
    };
  }, [getCurrentPosition, watchPosition]);

  return { location, heading, error, loading, refetch: getCurrentPosition };
};