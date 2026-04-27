/**
 * Pickup Store
 * 
 * Zustand store for pickup request state:
 * - Pin location (lat/lng)
 * - Address (reverse geocoded)
 * - Pickup status (ACTIVE, CONFIRMED, COMPLETED, EXPIRED, CANCELLED)
 * - Loading states
 * - Error handling
 */

import { create } from 'zustand';
import { PickupRequest, PickupStatus } from '../types';

interface Location {
  lat: number;
  lng: number;
}

interface PickupState {
  // Data
  pickup: PickupRequest | null;
  pinLocation: Location | null;
  address: string | null;
  
  // UI State
  isLoading: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  error: string | null;
  showBottomSheet: boolean;
  isDraggingPin: boolean;
  
  // Actions
  setPickup: (pickup: PickupRequest | null) => void;
  setPinLocation: (location: Location | null) => void;
  setAddress: (address: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setCancelling: (cancelling: boolean) => void;
  setError: (error: string | null) => void;
  setShowBottomSheet: (show: boolean) => void;
  setIsDraggingPin: (dragging: boolean) => void;
  
  // Computed
  hasActivePickup: () => boolean;
  canRequestPickup: () => boolean;
  getStatusColor: () => string;
  getStatusText: () => string;
  
  // Reset
  resetPin: () => void;
  clearError: () => void;
}

export const usePickupStore = create<PickupState>((set, get) => ({
  // Initial state
  pickup: null,
  pinLocation: null,
  address: null,
  isLoading: false,
  isSubmitting: false,
  isCancelling: false,
  error: null,
  showBottomSheet: false,
  isDraggingPin: false,

  // Actions
  setPickup: (pickup) => set({ pickup }),
  
  setPinLocation: (pinLocation) => {
    set({ pinLocation });
    // Auto-show bottom sheet when pin is dropped
    if (pinLocation) {
      set({ showBottomSheet: true });
    }
  },
  
  setAddress: (address) => set({ address }),
  setLoading: (isLoading) => set({ isLoading }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setCancelling: (isCancelling) => set({ isCancelling }),
  setError: (error) => set({ error }),
  setShowBottomSheet: (showBottomSheet) => set({ showBottomSheet }),
  setIsDraggingPin: (isDraggingPin) => set({ isDraggingPin }),

  // Computed getters
  hasActivePickup: () => {
    const { pickup } = get();
    if (!pickup) return false;
    return ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(pickup.status);
  },
  
  canRequestPickup: () => {
    const { pickup, pinLocation, isSubmitting } = get();
    // Can't request if already has active pickup
    if (pickup && ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(pickup.status)) {
      return false;
    }
    // Need pin location and not currently submitting
    return !!pinLocation && !isSubmitting;
  },
  
  getStatusColor: () => {
    const { pickup } = get();
    if (!pickup) return '#9E9E9E';
    
    switch (pickup.status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return '#4CAF50'; // Green
      case 'PENDING':
        return '#FF9800'; // Orange
      case 'COMPLETED':
        return '#2196F3'; // Blue
      case 'EXPIRED':
      case 'CANCELLED':
        return '#F44336'; // Red
      default:
        return '#9E9E9E';
    }
  },
  
  getStatusText: () => {
    const { pickup } = get();
    if (!pickup) return 'No Pickup';
    
    switch (pickup.status) {
      case 'PENDING':
        return 'Waiting for driver...';
      case 'CONFIRMED':
        return 'Driver confirmed!';
      case 'ACTIVE':
        return 'Pickup in progress';
      case 'COMPLETED':
        return 'Pickup completed';
      case 'EXPIRED':
        return 'Request expired';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return pickup.status;
    }
  },

  // Reset
  resetPin: () => set({ 
    pinLocation: null, 
    address: null, 
    showBottomSheet: false,
    error: null 
  }),
  
  clearError: () => set({ error: null }),
}));

export default usePickupStore;
