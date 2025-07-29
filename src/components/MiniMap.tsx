import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Location, Route } from '../types';

interface MiniMapProps {
  currentLocation: Location | null;
  destination: Location;
  route: Route | null;
  className?: string;
}

/**
 * Miniature map overlay showing current position, route, and destination
 * Provides spatial context during AR navigation
 */
export const MiniMap: React.FC<MiniMapProps> = ({
  currentLocation,
  destination,
  route,
  className = '',
}) => {
  // Calculate bounds for the mini map
  const getBounds = () => {
    if (!currentLocation) return null;

    const locations = [currentLocation, destination];
    if (route) {
      locations.push(...route.coordinates);
    }

    const lats = locations.map(loc => loc.latitude);
    const lngs = locations.map(loc => loc.longitude);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  };

  // Convert geographic coordinates to SVG coordinates
  const coordToSVG = (location: Location, bounds: any, width: number, height: number) => {
    const x = ((location.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - 20) + 10;
    const y = ((bounds.maxLat - location.latitude) / (bounds.maxLat - bounds.minLat)) * (height - 20) + 10;
    return { x, y };
  };

  const bounds = getBounds();
  const svgSize = 128;

  if (!bounds || !currentLocation) {
    return (
      <div className={`bg-black/50 backdrop-blur-md rounded-xl border border-white/20 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <MapPin className="w-6 h-6 text-white/50" />
        </div>
      </div>
    );
  }

  const currentPos = coordToSVG(currentLocation, bounds, svgSize, svgSize);
  const destPos = coordToSVG(destination, bounds, svgSize, svgSize);

  return (
    <div className={`bg-black/50 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden ${className}`}>
      <svg width={svgSize} height={svgSize} className="w-full h-full">
        {/* Background */}
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.2)" />
        
        {/* Route Line */}
        {route && route.coordinates.length > 1 && (
          <polyline
            points={route.coordinates
              .map(coord => {
                const pos = coordToSVG(coord, bounds, svgSize, svgSize);
                return `${pos.x},${pos.y}`;
              })
              .join(' ')}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            strokeOpacity="0.8"
          />
        )}

        {/* Current Location */}
        <circle
          cx={currentPos.x}
          cy={currentPos.y}
          r="6"
          fill="#10B981"
          stroke="white"
          strokeWidth="2"
        />
        <circle
          cx={currentPos.x}
          cy={currentPos.y}
          r="3"
          fill="white"
        />

        {/* Destination */}
        <circle
          cx={destPos.x}
          cy={destPos.y}
          r="5"
          fill="#EF4444"
          stroke="white"
          strokeWidth="2"
        />
      </svg>

      {/* Mini Map Header */}
      <div className="absolute top-1 left-1 right-1">
        <div className="flex items-center justify-center">
          <Navigation className="w-3 h-3 text-white/70" />
        </div>
      </div>
    </div>
  );
};