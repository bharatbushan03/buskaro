/**
 * Dashboard Store
 * 
 * Zustand store for student dashboard state:
 * - Bus location tracking
 * - Route data
 * - ETA updates
 * - Student location
 */

import { create } from 'zustand';
import { Bus, Route, ETAResult, PickupPoint } from '../types';

interface Location {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface DashboardState {
  // Data
  bus: Bus | null;
  route: Route | null;
  pickupPoint: PickupPoint | null;
  busLocation: Location | null;
  studentLocation: Location | null;
  eta: ETAResult | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isInfoCardExpanded: boolean;
  lastUpdated: string | null;
  
  // Map State
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  
  // Actions
  setBus: (bus: Bus | null) => void;
  setRoute: (route: Route | null) => void;
  setPickupPoint: (point: PickupPoint | null) => void;
  setBusLocation: (location: Location) => void;
  setStudentLocation: (location: Location) => void;
  setETA: (eta: ETAResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInfoCardExpanded: (expanded: boolean) => void;
  setMapRegion: (region: DashboardState['mapRegion']) => void;
  updateLastUpdated: () => void;
  
  // Getters
  getBusDistance: () => number | null;
  isBusNearby: () => boolean;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  bus: null,
  route: null,
  pickupPoint: null,
  busLocation: null,
  studentLocation: null,
  eta: null,
  isLoading: true,
  error: null,
  isInfoCardExpanded: false,
  lastUpdated: null,
  mapRegion: null,

  // Actions
  setBus: (bus) => set({ bus }),
  setRoute: (route) => set({ route }),
  setPickupPoint: (pickupPoint) => set({ pickupPoint }),
  
  setBusLocation: (location) => {
    set({ busLocation: location });
    get().updateLastUpdated();
  },
  
  setStudentLocation: (location) => set({ studentLocation: location }),
  
  setETA: (eta) => set({ eta }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setInfoCardExpanded: (isInfoCardExpanded) => set({ isInfoCardExpanded }),
  
  setMapRegion: (mapRegion) => set({ mapRegion }),
  
  updateLastUpdated: () => set({ lastUpdated: new Date().toISOString() }),

  // Getters
  getBusDistance: () => {
    const { busLocation, studentLocation } = get();
    if (!busLocation || !studentLocation) return null;
    
    return calculateDistance(
      busLocation.lat,
      busLocation.lng,
      studentLocation.lat,
      studentLocation.lng
    );
  },
  
  isBusNearby: () => {
    const distance = get().getBusDistance();
    return distance !== null && distance <= 500; // 500 meters
  },
}));

/**
 * Calculate distance between coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
