/**
 * Pickup Screen
 * 
 * Map-based pickup request screen:
 * - Long press to drop pin
 * - Draggable pin for fine-tuning
 * - Reverse geocoding for address
 * - Bottom sheet for confirmation
 * - Active pickup status display
 * - Real-time socket updates
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { PickupMarker } from '../../components/pickup/PickupMarker';
import { PickupBottomSheet } from '../../components/pickup/PickupBottomSheet';
import { usePickupStore } from '../../store/pickup.store';
import { socketService } from '../../services/socket.service';
import { api } from '../../services/api.service';
import { getCurrentLocation, requestLocationPermissions } from '../../services/location.service';
import { PickupRequest } from '../../types';
import { ENDPOINTS } from '../../constants/api';
import { colors, spacing, typography } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PICKUP_RADIUS = 200; // meters

export const PickupScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const {
    pickup,
    pinLocation,
    setPickup,
    setPinLocation,
    setAddress,
    setSubmitting,
    setCancelling,
    setError,
    setShowBottomSheet,
    resetPin,
    hasActivePickup,
  } = usePickupStore();

  /**
   * Initialize location
   */
  useEffect(() => {
    initializeLocation();
    fetchActivePickup();
  }, []);

  /**
   * Setup socket listeners for pickup updates
   */
  useEffect(() => {
    // Listen for pickup confirmation
    socketService.onPickupConfirmed((data) => {
      setPickup(data.pickup as PickupRequest);
      Toast.show({
        type: 'success',
        text1: 'Pickup Confirmed!',
        text2: `Driver ${data.driver?.name} accepted your request`,
      });
    });

    // Listen for pickup expiry
    socketService.onPickupExpired((data) => {
      setPickup(data.pickup as PickupRequest);
      Toast.show({
        type: 'error',
        text1: 'Pickup Expired',
        text2: 'Your pickup request has expired',
      });
      resetPin();
    });

    return () => {
      // Cleanup listeners on unmount
    };
  }, [setPickup, resetPin]);

  /**
   * Initialize user location
   */
  const initializeLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const hasPermission = await requestLocationPermissions();
      
      if (hasPermission) {
        const location = await getCurrentLocation();
        if (location) {
          const region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setInitialRegion(region);
        }
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  /**
   * Fetch any existing active pickup
   */
  const fetchActivePickup = async () => {
    try {
      const response = await api.get<any>(ENDPOINTS.STUDENT.PICKUP.ACTIVE_PIN);
      if (response.data.data) {
        setPickup(response.data.data as PickupRequest);
      }
    } catch (error: any) {
      // No active pickup is normal, don't show error
      if (error.response?.status !== 404) {
        console.error('Failed to fetch pickup:', error);
      }
    }
  };

  /**
   * Handle map long press - drop pin
   */
  const handleMapLongPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    // Don't allow new pin if there's an active pickup
    if (hasActivePickup()) {
      Toast.show({
        type: 'info',
        text1: 'Active Pickup',
        text2: 'You already have a pickup request',
      });
      return;
    }

    const { coordinate } = event.nativeEvent;
    setPinLocation({
      lat: coordinate.latitude,
      lng: coordinate.longitude,
    });

    // Reverse geocode the location
    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  /**
   * Reverse geocode coordinates to address
   */
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setAddress('Loading address...');
      // Use Google's reverse geocoding or your backend
      const response = await api.get<any>(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      setAddress(response.data.data.address);
    } catch (error) {
      setAddress('Unknown location');
    }
  };

  /**
   * Handle pin drag end
   */
  const handlePinDragEnd = (coordinate: { latitude: number; longitude: number }) => {
    setPinLocation({
      lat: coordinate.latitude,
      lng: coordinate.longitude,
    });
    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  /**
   * Confirm pickup request
   */
  const handleConfirmPickup = async () => {
    if (!pinLocation) return;

    try {
      setSubmitting(true);
      setError(null);

      // API call to create pickup
      const response = await api.post<any>(ENDPOINTS.STUDENT.PICKUP.REQUEST, {
        latitude: pinLocation.lat,
        longitude: pinLocation.lng,
        address: null, // Backend will reverse geocode
      });

      const newPickup = response.data.data as PickupRequest;
      setPickup(newPickup);

      // Emit socket event for real-time notification
      socketService.emitPinLocation(
        pinLocation.lat,
        pinLocation.lng,
        undefined
      );

      Toast.show({
        type: 'success',
        text1: 'Pickup Requested!',
        text2: 'Waiting for driver confirmation...',
      });

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to request pickup';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Cancel pickup request
   */
  const handleCancelPickup = async () => {
    Alert.alert(
      'Cancel Pickup?',
      'Are you sure you want to cancel your pickup request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              
              if (pickup?.id) {
                await api.delete<any>(ENDPOINTS.STUDENT.PICKUP.CANCEL_PIN(pickup.id));
              }
              
              // Emit socket event
              socketService.emitCancelPin(pickup?.id);

              resetPin();
              setPickup(null);

              Toast.show({
                type: 'success',
                text1: 'Cancelled',
                text2: 'Your pickup request has been cancelled',
              });
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || 'Failed to cancel pickup';
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMsg,
              });
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Close bottom sheet
   */
  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
  };

  /**
   * Center map on current location
   */
  const centerOnCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not get current location',
      });
    }
  };

  /**
   * Get pickup location for marker
   */
  const getPickupCoordinate = () => {
    if (pickup) {
      return {
        latitude: pickup.lat,
        longitude: pickup.lng,
      };
    }
    if (pinLocation) {
      return {
        latitude: pinLocation.lat,
        longitude: pinLocation.lng,
      };
    }
    return null;
  };

  if (isLoadingLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  const pickupCoordinate = getPickupCoordinate();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Pickup</Text>
        <Text style={styles.headerSubtitle}>
          {hasActivePickup() 
            ? 'Your pickup is active' 
            : 'Long press on map to drop a pin'}
        </Text>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion || {
          latitude: 0,
          longitude: 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onLongPress={handleMapLongPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* Pickup Radius Circle */}
        {pickupCoordinate && (
          <Circle
            center={pickupCoordinate}
            radius={PICKUP_RADIUS}
            fillColor="rgba(33, 150, 243, 0.1)"
            strokeColor={colors.primary[500]}
            strokeWidth={2}
          />
        )}

        {/* Pickup Pin Marker */}
        {pickupCoordinate && (
          <PickupMarker
            coordinate={pickupCoordinate}
            isDragging={false}
            isActive={hasActivePickup()}
            title={pickup?.address || 'Pickup Location'}
            onDragStart={() => {}}
            onDragEnd={handlePinDragEnd}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnCurrentLocation}>
          <Ionicons name="locate" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Instructions Overlay */}
      {!hasActivePickup() && !pinLocation && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsCard}>
            <Ionicons name="hand-left" size={32} color={colors.primary[500]} />
            <Text style={styles.instructionsText}>
              Long press anywhere on the map to set your pickup location
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <PickupBottomSheet
        onConfirmPickup={handleConfirmPickup}
        onCancelPickup={handleCancelPickup}
        onClose={handleCloseBottomSheet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  loadingText: {
    marginTop: spacing[4],
    ...typography.body,
    color: colors.text.secondary,
  },

  // Header
  header: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },

  // Map
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: spacing[4],
    bottom: 320,
    zIndex: 10,
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

  // Instructions Overlay
  instructionsOverlay: {
    position: 'absolute',
    top: '40%',
    left: spacing[6],
    right: spacing[6],
    zIndex: 5,
  },
  instructionsCard: {
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionsText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});

export default PickupScreen;

