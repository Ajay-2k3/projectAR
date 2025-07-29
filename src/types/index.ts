/**
 * Type definitions for the AR Navigation application
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Route {
  coordinates: Location[];
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinate: Location;
}

export interface NavigationState {
  currentLocation: Location | null;
  destination: Location | null;
  route: Route | null;
  currentHeading: number; // compass bearing in degrees
  isNavigating: boolean;
  currentStepIndex: number;
  distanceToDestination: number;
}

export interface ARState {
  isARActive: boolean;
  cameraStream: MediaStream | null;
  arrowRotation: number; // rotation angle for 3D arrow
  isCalibrated: boolean;
}

export interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface MapSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

// types/index.ts
export interface Location {
  latitude: number;
  longitude: number;
}

export interface POIMarker extends Location {
  id: string;
  name: string;
  type?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
}
