import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Location } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useCamera } from './hooks/useCamera';
import { PermissionGate } from './components/PermissionGate';
import { MapPicker } from './components/MapPicker';
import { NavigationView } from './components/NavigationView';

type AppState = 'permissions' | 'map-picker' | 'navigation';

/**
 * Main application component orchestrating the AR navigation experience
 * Manages app state, permissions, and navigation flow
 */
function App() {
  const [appState, setAppState] = useState<AppState>('permissions');
  const [destination, setDestination] = useState<Location | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [permissionsRequested, setPermissionsRequested] = useState<boolean>(false);

  // Custom hooks for device access
  const { 
    location: currentLocation, 
    heading: currentHeading, 
    error: locationError, 
    loading: locationLoading 
  } = useGeolocation(true, 5000);

  const {
    stream: cameraStream,
    error: cameraError,
    isLoading: cameraLoading,
    hasPermission: cameraPermission,
    requestCameraAccess,
  } = useCamera();

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle permission requests
  const handlePermissionRequest = async () => {
    setPermissionsRequested(true);
    await requestCameraAccess();
    
    // Check if we have both permissions
    if (currentLocation && cameraPermission) {
      setAppState('map-picker');
    }
  };

  // Handle destination selection
  const handleDestinationSelect = (dest: Location, name: string) => {
    setDestination(dest);
    setDestinationName(name);
    setAppState('navigation');
  };

  // Handle navigation back actions
  const handleBack = () => {
    if (appState === 'navigation') {
      setAppState('map-picker');
      setDestination(null);
      setDestinationName('');
    } else if (appState === 'map-picker') {
      setAppState('permissions');
    }
  };

  // Auto-advance to map picker when permissions are granted
  useEffect(() => {
    if (permissionsRequested && currentLocation && cameraPermission && appState === 'permissions') {
      setAppState('map-picker');
    }
  }, [permissionsRequested, currentLocation, cameraPermission, appState]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Render permission gate
  if (appState === 'permissions') {
    return (
      <>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-6 h-6 text-white" />
          ) : (
            <Moon className="w-6 h-6 text-white" />
          )}
        </button>

        <PermissionGate
          onRequestPermissions={handlePermissionRequest}
          cameraError={cameraError || undefined}
          locationError={locationError || undefined}
          isLoading={cameraLoading || locationLoading}
        />
      </>
    );
  }

  // Render map picker
  if (appState === 'map-picker') {
    return (
      <>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-16 z-50 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5 text-white" />
          )}
        </button>

        <MapPicker
          currentLocation={currentLocation}
          onDestinationSelect={handleDestinationSelect}
          onBack={handleBack}
        />
      </>
    );
  }

  // Render navigation view
  if (appState === 'navigation' && destination) {
    return (
      <NavigationView
        currentLocation={currentLocation}
        destination={destination}
        destinationName={destinationName}
        currentHeading={currentHeading}
        cameraStream={cameraStream}
        onBack={handleBack}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Loading AR Navigation...</p>
      </div>
    </div>
  );
}

export default App;