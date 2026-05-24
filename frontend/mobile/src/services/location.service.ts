/**
 * Location Service
 * 
 * GPS location tracking for drivers.
 */

import * as Location from 'expo-location';
import { socketService } from './socket.service';
import { useAuthStore } from '../store/auth.store';

let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if has location permission
 */
export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        console.warn('Location permission denied');
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return location;
  } catch (error) {
    console.warn('Failed to get location:', error);
    return null;
  }
}

/**
 * Start location tracking with a custom callback
 */
export async function startLocationTracking(callback: (location: Location.LocationObject) => void): Promise<void> {
  const { user } = useAuthStore.getState();
  
  if (user?.role !== 'DRIVER') {
    return;
  }

  const hasPermission = await hasLocationPermission();
  
  if (!hasPermission) {
    const granted = await requestLocationPermissions();
    if (!granted) {
      console.warn('Location permission denied');
      return;
    }
  }

  try {
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      callback
    );

    console.log('Location tracking started with custom callback');
  } catch (error) {
    console.warn('Failed to start location tracking:', error);
  }
}

/**
 * Initialize location tracking for drivers
 */
export async function initializeLocationTracking(): Promise<void> {
  const { user } = useAuthStore.getState();
  
  // Only for drivers
  if (user?.role !== 'DRIVER') {
    return;
  }

  const hasPermission = await hasLocationPermission();
  
  if (!hasPermission) {
    const granted = await requestLocationPermissions();
    if (!granted) {
      console.warn('Location permission denied');
      return;
    }
  }

  // Start watching position
  try {
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        // Send location to server
        socketService.updateLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.speed || undefined
        );
      }
    );

    console.log('Location tracking started');
  } catch (error) {
    console.warn('Failed to start location tracking:', error);
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('Location tracking stopped');
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export default {
  requestLocationPermissions,
  hasLocationPermission,
  getCurrentLocation,
  startLocationTracking,
  initializeLocationTracking,
  stopLocationTracking,
  calculateDistance,
};
