/**
 * Driver Dashboard Screen
 * 
 * Complete driver dashboard with:
 * - Trip control (start/end trip)
 * - Navigation-focused map view
 * - Real-time pickup list
 * - Socket.IO integration for live updates
 * - Location tracking and route display
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { DriverMapView, DriverMapViewRef } from '../../components/driver/DriverMapView';
import { TripControlBar } from '../../components/driver/TripControlBar';
import { PickupListSheet } from '../../components/driver/PickupListSheet';
import { useDriverStore } from '../../store/driver.store';
import { Trip } from '../../types';
import { socketService } from '../../services/socket.service';
import { api } from '../../services/api.service';
import { getCurrentLocation, startLocationTracking, stopLocationTracking } from '../../services/location.service';
import { PickupRequest } from '../../types';
import { ENDPOINTS } from '../../constants/api';
import { colors, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Extended pickup type with calculated fields
interface PickupWithMetrics extends PickupRequest {
  distance?: number;
  etaMinutes?: number;
}

const normalizeTripStatus = (status?: string) => {
  if (status === 'IN_PROGRESS' || status === 'PAUSED' || status === 'IN_SERVICE') {
    return 'IN_SERVICE' as const;
  }

  if (status === 'COMPLETED') {
    return 'COMPLETED' as const;
  }

  return 'IDLE' as const;
};

const normalizeRoutePath = (path: any) => {
  const coordinates = Array.isArray(path)
    ? path
    : path?.geometry?.coordinates;

  if (!Array.isArray(coordinates)) {
    return null;
  }

  return coordinates
    .map((point: any) => {
      if (Array.isArray(point) && point.length >= 2) {
        return { latitude: point[1], longitude: point[0] };
      }

      if (typeof point?.lat === 'number' && typeof point?.lng === 'number') {
        return { latitude: point.lat, longitude: point.lng };
      }

      return null;
    })
    .filter(Boolean) as Array<{ latitude: number; longitude: number }>;
};

export const DashboardScreen: React.FC = () => {
  const mapRef = useRef<DriverMapViewRef>(null);
  const [pickupsWithMetrics, setPickupsWithMetrics] = useState<PickupWithMetrics[]>([]);

  const {
    trip,
    tripStatus,
    driverLocation,
    pickups,
    selectedPickupId,
    routePath,
    isLoading,
    isStartingTrip,
    isEndingTrip,
    isCompletingPickup,
    error,
    showPickupSheet,
    setTrip,
    setTripStatus,
    setDriverLocation,
    setIsTrackingLocation,
    setPickups,
    addPickup,
    removePickup,
    completePickup,
    setSelectedPickupId,
    setRoutePath,
    setStartingTrip,
    setEndingTrip,
    setCompletingPickup,
    setError,
    setShowPickupSheet,
    getActivePickups,
    canStartTrip,
    canEndTrip,
  } = useDriverStore();

  /**
   * Initialize driver data and location
   */
  useEffect(() => {
    initializeDriver();
    return () => {
      stopLocationTracking();
    };
  }, []);

  /**
   * Setup socket listeners for real-time updates
   */
  useEffect(() => {
    // Listen for new pickup requests
    socketService.onPickupNewRequest((data) => {
      const newPickup = data.pickup as PickupRequest;
      addPickup(newPickup);
      
      // Show notification
      Toast.show({
        type: 'info',
        text1: 'New Pickup Request',
        text2: `${newPickup.studentName || 'Student'} at ${Math.round(data.distance || 0)}m`,
      });
      
      // Recalculate metrics
      calculatePickupMetrics();
    });

    // Listen for pickup removal
    socketService.onPickupRemoved((data) => {
      removePickup(data.pickupId);
      calculatePickupMetrics();
    });

    return () => {
      socketService.off('pickup:new-request');
      socketService.off('pickup:removed');
    };
  }, [addPickup, removePickup]);

  /**
   * Start location tracking when trip is active
   */
  useEffect(() => {
    if (tripStatus === 'IN_SERVICE') {
      startDriverLocationTracking();
    } else {
      stopLocationTracking();
      setIsTrackingLocation(false);
    }
  }, [tripStatus]);

  /**
   * Calculate distances and ETAs when driver location or pickups change
   */
  useEffect(() => {
    calculatePickupMetrics();
  }, [driverLocation, pickups]);

  /**
   * Auto-center on driver when trip starts
   */
  useEffect(() => {
    if (tripStatus === 'IN_SERVICE' && driverLocation) {
      mapRef.current?.centerOnDriver();
    }
  }, [tripStatus]);

  /**
   * Initialize driver: fetch trip status, pickups, and location
   */
  const initializeDriver = async () => {
    try {
      // Get current location
      const location = await getCurrentLocation();
      if (location) {
        setDriverLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          heading: location.coords.heading || 0,
          speed: location.coords.speed || 0,
        });
      }

      // Fetch active trip
      const tripResponse = await api.get<any>(ENDPOINTS.DRIVER.TRIP_STATUS);
      const tripData = tripResponse.data.data;
      if (tripData?.hasActiveTrip && tripData.trip) {
        const normalizedStatus = normalizeTripStatus(tripData.trip.status);
        setTrip({ ...tripData.trip, status: normalizedStatus } as Trip);
        setTripStatus(normalizedStatus);
      } else {
        setTrip(null);
        setTripStatus('IDLE');
      }

      // Fetch assigned route and pickups
      await fetchRouteAndPickups();
    } catch (error: any) {
      // No active trip is normal
      if (error.response?.status !== 404) {
        console.error('Failed to initialize driver:', error);
      }
    }
  };

  /**
   * Fetch route and pickups
   */
  const fetchRouteAndPickups = async () => {
    try {
      const [routeResponse, pickupsResponse] = await Promise.all([
        api.get<any>(ENDPOINTS.DRIVER.ROUTE),
        api.get<any>(ENDPOINTS.DRIVER.PICKUPS.NEARBY),
      ]);

      if (routeResponse.data.data) {
        const route = routeResponse.data.data;
        setRoutePath(normalizeRoutePath(route.path));
      }

      if (pickupsResponse.data.data) {
        const pickupData = pickupsResponse.data.data;
        setPickups(Array.isArray(pickupData) ? pickupData : pickupData.pickups || []);
      }
    } catch (error) {
      console.error('Failed to fetch route/pickups:', error);
    }
  };

  /**
   * Start location tracking
   */
  const startDriverLocationTracking = () => {
    setIsTrackingLocation(true);
    
    startLocationTracking((location) => {
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
      };
      
      setDriverLocation(newLocation);
      
      // Emit location to server
      socketService.emit('driver:location', {
        lat: newLocation.lat,
        lng: newLocation.lng,
        heading: newLocation.heading,
        speed: newLocation.speed,
      });
    });
  };

  /**
   * Calculate distance and ETA for each pickup
   */
  const calculatePickupMetrics = () => {
    if (!driverLocation || pickups.length === 0) return;

    const pickupsWithCalcs = pickups.map((pickup) => {
      const distance = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        pickup.lat,
        pickup.lng
      );
      
      // Simple ETA: distance / average speed (assuming 20km/h for bus)
      const avgSpeedKmh = 20;
      const etaMinutes = (distance / 1000) / (avgSpeedKmh / 60);

      return {
        ...pickup,
        distance,
        etaMinutes,
      };
    });

    // Sort by distance
    pickupsWithCalcs.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setPickupsWithMetrics(pickupsWithCalcs);
  };

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /**
   * Start trip
   */
  const handleStartTrip = async () => {
    if (!canStartTrip()) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Start Trip',
        text2: 'Trip already in progress',
      });
      return;
    }

    try {
      setStartingTrip(true);
      setError(null);

      const response = await api.post<any>(ENDPOINTS.DRIVER.TRIP.START);
      const newTrip = response.data.data;
      
      setTrip(newTrip);
      setTripStatus('IN_SERVICE');
      
      // Join driver socket room
      socketService.joinDriverRoom();
      
      Toast.show({
        type: 'success',
        text1: 'Trip Started',
        text2: 'Drive safely!',
      });

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to start trip';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setStartingTrip(false);
    }
  };

  /**
   * End trip
   */
  const handleEndTrip = async () => {
    if (!canEndTrip()) {
      Toast.show({
        type: 'error',
        text1: 'Cannot End Trip',
        text2: 'No active trip',
      });
      return;
    }

    // Check if there are pending pickups
    const pendingCount = getActivePickups().length;
    if (pendingCount > 0) {
      Alert.alert(
        'Pending Pickups',
        `You have ${pendingCount} pending pickup(s). Are you sure you want to end the trip?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Anyway', style: 'destructive', onPress: confirmEndTrip },
        ]
      );
      return;
    }

    confirmEndTrip();
  };

  /**
   * Confirm end trip
   */
  const confirmEndTrip = async () => {
    try {
      setEndingTrip(true);
      setError(null);

      await api.post(ENDPOINTS.DRIVER.TRIP.END);
      
      setTrip(null);
      setTripStatus('COMPLETED');
      
      // Leave driver socket room
      socketService.leaveDriverRoom();
      
      // Stop location tracking
      stopLocationTracking();
      setIsTrackingLocation(false);

      Toast.show({
        type: 'success',
        text1: 'Trip Ended',
        text2: 'Great job today!',
      });

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to end trip';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setEndingTrip(false);
    }
  };

  /**
   * Handle pickup press - center map on pickup
   */
  const handlePickupPress = (pickupId: string) => {
    setSelectedPickupId(pickupId);
    
    const pickup = pickups.find(p => p.id === pickupId);
    if (pickup) {
      mapRef.current?.centerOnPickup(pickup.lat, pickup.lng);
    }
  };

  /**
   * Handle pickup complete
   */
  const handlePickupComplete = async (pickupId: string) => {
    try {
      setCompletingPickup(true);

      await api.patch(ENDPOINTS.DRIVER.PICKUPS.COMPLETE(pickupId));
      
      // Emit socket event
      socketService.emit('driver:pickup-complete', { pickupId });

      // Update local state
      completePickup(pickupId);

      Toast.show({
        type: 'success',
        text1: 'Pickup Complete',
        text2: 'Student picked up successfully',
      });

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to complete pickup';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setCompletingPickup(false);
    }
  };

  /**
   * Center map on driver
   */
  const handleCenterOnDriver = () => {
    mapRef.current?.centerOnDriver();
  };

  /**
   * Toggle pickup sheet visibility
   */
  const togglePickupSheet = () => {
    setShowPickupSheet(!showPickupSheet);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Map View */}
      <DriverMapView
        ref={mapRef}
        driverLocation={driverLocation}
        pickups={pickups}
        routePath={routePath}
        selectedPickupId={selectedPickupId}
        onPickupPress={handlePickupPress}
        followDriver={tripStatus === 'IN_SERVICE'}
      />

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleCenterOnDriver}>
          <Ionicons name="locate" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={togglePickupSheet}>
          <Ionicons name="list" size={22} color={colors.primary[500]} />
          {getActivePickups().length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getActivePickups().length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Trip Control Bar */}
      <View style={styles.controlBar}>
        <TripControlBar
          status={tripStatus}
          pickupCount={getActivePickups().length}
          isStarting={isStartingTrip}
          isEnding={isEndingTrip}
          onStartTrip={handleStartTrip}
          onEndTrip={handleEndTrip}
        />
      </View>

      {/* Pickup List Sheet */}
      <PickupListSheet
        pickups={pickupsWithMetrics}
        selectedPickupId={selectedPickupId}
        onPickupPress={handlePickupPress}
        onPickupComplete={handlePickupComplete}
        isCompletingPickup={isCompletingPickup}
        show={showPickupSheet}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  mapControls: {
    position: 'absolute',
    right: spacing[4],
    top: 120,
    zIndex: 10,
    gap: spacing[2],
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  controlBar: {
    position: 'absolute',
    bottom: 320,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default DashboardScreen;
