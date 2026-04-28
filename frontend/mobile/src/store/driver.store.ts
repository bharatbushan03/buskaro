/**
 * Driver Store
 * 
 * Zustand store for driver state:
 * - Trip status (IDLE, IN_SERVICE, COMPLETED)
 * - Driver location (lat/lng)
 * - Pickup requests list
 * - Route path (GeoJSON)
 * - Loading/error states
 */

import { create } from 'zustand';
import { PickupRequest, Trip, Route, PickupStatus } from '../types';

interface Location {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export type TripStatus = 'IDLE' | 'IN_SERVICE' | 'COMPLETED';

interface DriverState {
  // Trip data
  trip: Trip | null;
  tripStatus: TripStatus;
  
  // Location
  driverLocation: Location | null;
  isTrackingLocation: boolean;
  
  // Pickups
  pickups: PickupRequest[];
  selectedPickupId: string | null;
  completedPickups: string[];
  
  // Route
  route: Route | null;
  routePath: Array<{ latitude: number; longitude: number }> | null;
  
  // UI State
  isLoading: boolean;
  isStartingTrip: boolean;
  isEndingTrip: boolean;
  isCompletingPickup: boolean;
  error: string | null;
  showPickupSheet: boolean;
  
  // Actions
  setTrip: (trip: Trip | null) => void;
  setTripStatus: (status: TripStatus) => void;
  setDriverLocation: (location: Location | null) => void;
  setIsTrackingLocation: (tracking: boolean) => void;
  setPickups: (pickups: PickupRequest[]) => void;
  addPickup: (pickup: PickupRequest) => void;
  removePickup: (pickupId: string) => void;
  updatePickupStatus: (pickupId: string, status: PickupStatus) => void;
  completePickup: (pickupId: string) => void;
  setSelectedPickupId: (id: string | null) => void;
  setRoute: (route: Route | null) => void;
  setRoutePath: (path: Array<{ latitude: number; longitude: number }> | null) => void;
  setLoading: (loading: boolean) => void;
  setStartingTrip: (starting: boolean) => void;
  setEndingTrip: (ending: boolean) => void;
  setCompletingPickup: (completing: boolean) => void;
  setError: (error: string | null) => void;
  setShowPickupSheet: (show: boolean) => void;
  clearError: () => void;
  reset: () => void;
  
  // Computed
  getActivePickups: () => PickupRequest[];
  getNextPickup: () => PickupRequest | null;
  getPendingPickupsCount: () => number;
  canStartTrip: () => boolean;
  canEndTrip: () => boolean;
  hasActiveTrip: () => boolean;
}

const initialState = {
  trip: null,
  tripStatus: 'IDLE' as TripStatus,
  driverLocation: null,
  isTrackingLocation: false,
  pickups: [],
  selectedPickupId: null,
  completedPickups: [],
  route: null,
  routePath: null,
  isLoading: false,
  isStartingTrip: false,
  isEndingTrip: false,
  isCompletingPickup: false,
  error: null,
  showPickupSheet: true,
};

export const useDriverStore = create<DriverState>((set, get) => ({
  ...initialState,

  // Actions
  setTrip: (trip) => set({ trip }),
  
  setTripStatus: (tripStatus) => set({ tripStatus }),
  
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  
  setIsTrackingLocation: (isTrackingLocation) => set({ isTrackingLocation }),
  
  setPickups: (pickups) => set({ pickups }),
  
  addPickup: (pickup) => {
    const { pickups } = get();
    // Avoid duplicates
    if (!pickups.find(p => p.id === pickup.id)) {
      set({ pickups: [...pickups, pickup] });
    }
  },
  
  removePickup: (pickupId) => {
    const { pickups } = get();
    set({ pickups: pickups.filter(p => p.id !== pickupId) });
  },
  
  updatePickupStatus: (pickupId, status) => {
    const { pickups } = get();
    set({
      pickups: pickups.map(p =>
        p.id === pickupId ? { ...p, status } : p
      ),
    });
  },
  
  completePickup: (pickupId) => {
    const { completedPickups, pickups } = get();
    set({
      completedPickups: [...completedPickups, pickupId],
      pickups: pickups.map(p =>
        p.id === pickupId ? { ...p, status: 'COMPLETED' as PickupStatus } : p
      ),
    });
  },
  
  setSelectedPickupId: (selectedPickupId) => set({ selectedPickupId }),
  
  setRoute: (route) => set({ route }),
  
  setRoutePath: (routePath) => set({ routePath }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setStartingTrip: (isStartingTrip) => set({ isStartingTrip }),
  
  setEndingTrip: (isEndingTrip) => set({ isEndingTrip }),
  
  setCompletingPickup: (isCompletingPickup) => set({ isCompletingPickup }),
  
  setError: (error) => set({ error }),
  
  setShowPickupSheet: (showPickupSheet) => set({ showPickupSheet }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),

  // Computed getters
  getActivePickups: () => {
    const { pickups } = get();
    return pickups.filter(p => 
      ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(p.status)
    );
  },
  
  getNextPickup: () => {
    const activePickups = get().getActivePickups();
    // Return first pending pickup (closest one)
    return activePickups.find(p => p.status === 'PENDING') || 
           activePickups[0] || 
           null;
  },
  
  getPendingPickupsCount: () => {
    const { pickups } = get();
    return pickups.filter(p => p.status === 'PENDING').length;
  },
  
  canStartTrip: () => {
    const { tripStatus } = get();
    return tripStatus === 'IDLE';
  },
  
  canEndTrip: () => {
    const { tripStatus } = get();
    return tripStatus === 'IN_SERVICE';
  },
  
  hasActiveTrip: () => {
    const { tripStatus } = get();
    return tripStatus === 'IN_SERVICE';
  },
}));

export default useDriverStore;
