import React, { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Navigation, ArrowRight, Loader } from 'lucide-react';
import { Location, MapSearchResult } from '../types';
import { mapService } from '../services/mapService';

interface MapPickerProps {
  currentLocation: Location | null;
  onDestinationSelect: (destination: Location, name: string) => void;
  onBack: () => void;
}

/**
 * Interactive map picker component for destination selection
 * Features search functionality and visual destination selection
 */
export const MapPicker: React.FC<MapPickerProps> = ({
  currentLocation,
  onDestinationSelect,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await mapService.searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleDestinationSelect = (result: MapSearchResult) => {
    const destination: Location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    
    setSelectedDestination(destination);
    setSelectedName(result.display_name);
    setSearchResults([]);
  };

  const handleStartNavigation = () => {
    if (selectedDestination && selectedName) {
      onDestinationSelect(selectedDestination, selectedName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-white rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-white">Choose Destination</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Location</p>
                <p className="font-semibold text-gray-800">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search for places, addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-lg"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-t border-gray-200">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleDestinationSelect(result)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium truncate">
                        {result.display_name.split(',')[0]}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.display_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-red-600 text-center">{searchError}</p>
            </div>
          )}
        </div>

        {/* Selected Destination */}
        {selectedDestination && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Ready to Navigate
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {selectedName.split(',').slice(0, 2).join(', ')}
                </p>
                {currentLocation && (
                  <p className="text-sm text-gray-500">
                    Distance: {Math.round(
                      mapService.calculateDistance(currentLocation, selectedDestination) / 1000 * 10
                    ) / 10} km
                  </p>
                )}
              </div>
              <button
                onClick={handleStartNavigation}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Start AR Navigation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};