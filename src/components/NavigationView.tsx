import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation2, Target, AlertCircle } from 'lucide-react';
import { Location, Route, NavigationState } from '../types';
import { mapService } from '../services/mapService';
import { AROverlay } from './AROverlay';
import { MiniMap } from './MiniMap';

interface NavigationViewProps {
  currentLocation: Location | null;
  destination: Location;
  destinationName: string;
  currentHeading: number;
  cameraStream: MediaStream | null;
  onBack: () => void;
}

/**
 * Main navigation view with AR overlay, camera feed, and navigation controls
 * Orchestrates real-time navigation with step-by-step guidance
 */
export const NavigationView: React.FC<NavigationViewProps> = ({
  currentLocation,
  destination,
  destinationName,
  currentHeading,
  cameraStream,
  onBack,
}) => {
  const [navState, setNavState] = useState<NavigationState>({
    currentLocation,
    destination,
    route: null,
    currentHeading,
    isNavigating: true,
    currentStepIndex: 0,
    distanceToDestination: 0,
  });

  const [route, setRoute] = useState<Route | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Calculate route on component mount
  useEffect(() => {
    const calculateRoute = async () => {
      if (!currentLocation) return;

      setIsCalculatingRoute(true);
      setRouteError(null);

      try {
        const calculatedRoute = await mapService.calculateRoute(currentLocation, destination);
        setRoute(calculatedRoute);
        setNavState(prev => ({ ...prev, route: calculatedRoute }));
      } catch (error) {
        setRouteError('Failed to calculate route. Using direct navigation.');
        console.error('Route calculation error:', error);
      } finally {
        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [currentLocation, destination]);

  // Update navigation state when location changes
  useEffect(() => {
    if (!currentLocation) return;

    const distanceToDestination = mapService.calculateDistance(currentLocation, destination);
    
    // Check if arrived (within 10 meters)
    if (distanceToDestination < 10 && !hasArrived) {
      setHasArrived(true);
      // Could trigger celebration animation or sound here
    }

    setNavState(prev => ({
      ...prev,
      currentLocation,
      currentHeading,
      distanceToDestination,
    }));
  }, [currentLocation, destination, currentHeading, hasArrived]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getCurrentInstruction = (): string => {
    if (hasArrived) return 'You have arrived at your destination!';
    if (!route || route.steps.length === 0) return 'Head towards destination';
    
    const currentStep = route.steps[navState.currentStepIndex];
    return currentStep?.instruction || 'Continue straight';
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Camera Feed Background */}
      {cameraStream && (
        <video
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          ref={(video) => {
            if (video && cameraStream) {
              video.srcObject = cameraStream;
            }
          }}
        />
      )}

      {/* AR Overlay */}
      {currentLocation && !hasArrived && (
        <AROverlay
          currentLocation={currentLocation}
          destination={destination}
          currentHeading={currentHeading}
        />
      )}

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex-1 px-4">
            <h1 className="text-white font-semibold text-center truncate">
              {destinationName.split(',')[0]}
            </h1>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Route Calculation Loading */}
      {isCalculatingRoute && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white text-sm">Calculating route...</p>
          </div>
        </div>
      )}

      {/* Route Error */}
      {routeError && (
        <div className="absolute top-20 left-4 right-4 z-20">
          <div className="bg-orange-500/90 backdrop-blur-md rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white text-sm">{routeError}</p>
          </div>
        </div>
      )}

      {/* Arrival Celebration */}
      {hasArrived && (
        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl transform animate-pulse">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">You've Arrived!</h2>
            <p className="text-gray-600 mb-4">Welcome to your destination</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Mini Map */}
      <div className="absolute top-24 right-4 z-20">
        <MiniMap
          currentLocation={currentLocation}
          destination={destination}
          route={route}
          className="w-32 h-32"
        />
      </div>

      {/* Bottom Navigation Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/10 z-20">
        <div className="p-4 space-y-3">
          {/* Distance Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation2 className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {formatDistance(navState.distanceToDestination)}
              </span>
            </div>
            {route && (
              <div className="text-white/70 text-sm">
                ETA: {Math.round(route.duration / 60)} min
              </div>
            )}
          </div>

          {/* Current Instruction */}
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-white text-center font-medium">
              {getCurrentInstruction()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};