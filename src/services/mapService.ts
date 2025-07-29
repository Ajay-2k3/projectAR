import { Location, Route, RouteStep, MapSearchResult } from '../types';
import { distance } from '@turf/distance';

/**
 * Service for handling map operations, geocoding, and route calculation
 * Uses OpenStreetMap APIs for free, reliable mapping services
 */
class MapService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly ROUTING_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Search for places using OpenStreetMap Nominatim API
   */
  async searchPlaces(query: string): Promise<MapSearchResult[]> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const results = await response.json();
      return results.map((result: any) => ({
        display_name: result.display_name,
        lat: result.lat,
        lon: result.lon,
        place_id: result.place_id,
      }));
    } catch (error) {
      console.error('Place search error:', error);
      throw new Error('Failed to search for places');
    }
  }

  /**
   * Calculate walking route between two points using OSRM
   */
  async calculateRoute(start: Location, end: Location): Promise<Route> {
    try {
      const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
      const response = await fetch(
        `${this.ROUTING_BASE_URL}/${coords}?overview=full&steps=true&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error('Route calculation failed');
      }
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      const coordinates: Location[] = route.geometry.coordinates.map((coord: [number, number]) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));
      
      // Extract route steps from the response
      const steps: RouteStep[] = route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction || 'Continue straight',
        distance: step.distance,
        duration: step.duration,
        coordinate: {
          latitude: step.maneuver.location[1],
          longitude: step.maneuver.location[0],
        },
      }));
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        steps,
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback: create a simple direct route
      return this.createDirectRoute(start, end);
    }
  }

  /**
   * Create a simple direct route as fallback
   */
  private createDirectRoute(start: Location, end: Location): Route {
    const distanceInKm = distance(
      [start.longitude, start.latitude],
      [end.longitude, end.latitude],
      { units: 'kilometers' }
    );
    
    const distanceInMeters = distanceInKm * 1000;
    const estimatedDuration = distanceInMeters / 1.4; // Assume 1.4 m/s walking speed
    
    return {
      coordinates: [start, end],
      distance: distanceInMeters,
      duration: estimatedDuration,
      steps: [
        {
          instruction: 'Head towards destination',
          distance: distanceInMeters,
          duration: estimatedDuration,
          coordinate: end,
        },
      ],
    };
  }

  /**
   * Calculate bearing between two points for arrow direction
   */
  calculateBearing(start: Location, end: Location): number {
    const startLat = start.latitude * Math.PI / 180;
    const startLng = start.longitude * Math.PI / 180;
    const endLat = end.latitude * Math.PI / 180;
    const endLng = end.longitude * Math.PI / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360 degrees
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(start: Location, end: Location): number {
    return distance(
      [start.longitude, start.latitude],
      [end.longitude, end.latitude],
      { units: 'kilometers' }
    ) * 1000;
  }
}

export const mapService = new MapService();