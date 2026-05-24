/**
 * Student Dashboard Screen
 * 
 * Main student screen with live bus tracking on map:
 * - Full-screen MapView
 * - Real-time bus location
 * - ETA display panel
 * - Draggable bottom info card
 * - Socket.IO integration
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { BusMarker } from '../../components/map/BusMarker';
import { StudentMarker } from '../../components/map/StudentMarker';
import { useDashboardStore } from '../../store/dashboard.store';
import { useAuthStore } from '../../store/auth.store';
import { socketService } from '../../services/socket.service';
import { api } from '../../services/api.service';
import { getCurrentLocation, requestLocationPermissions } from '../../services/location.service';
import { ETAResult } from '../../types';
import { ENDPOINTS } from '../../constants/api';
import { colors, spacing, typography } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_MIN_HEIGHT = 120;
const CARD_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const {
    bus,
    route,
    pickupPoint,
    busLocation,
    studentLocation,
    eta,
    isLoading,
    error,
    isInfoCardExpanded,
    setBus,
    setRoute,
    setPickupPoint,
    setBusLocation,
    setStudentLocation,
    setETA,
    setLoading,
    setError,
    setInfoCardExpanded,
    setMapRegion,
    isBusNearby,
  } = useDashboardStore();

  const mapRef = useRef<MapView>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Animated value for bottom card
  const cardAnimation = useRef(new Animated.Value(CARD_MIN_HEIGHT)).current;

  // Pan responder for draggable card
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(
          CARD_MIN_HEIGHT,
          Math.min(CARD_MAX_HEIGHT, CARD_MIN_HEIGHT - gestureState.dy)
        );
        cardAnimation.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = (CARD_MIN_HEIGHT + CARD_MAX_HEIGHT) / 2;
        const currentHeight = CARD_MIN_HEIGHT - gestureState.dy;

        if (currentHeight > threshold) {
          // Expand
          Animated.spring(cardAnimation, {
            toValue: CARD_MAX_HEIGHT,
            useNativeDriver: false,
            friction: 8,
          }).start(() => setInfoCardExpanded(true));
        } else {
          // Collapse
          Animated.spring(cardAnimation, {
            toValue: CARD_MIN_HEIGHT,
            useNativeDriver: false,
            friction: 8,
          }).start(() => setInfoCardExpanded(false));
        }
      },
    })
  ).current;

  /**
   * Fetch initial dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get student's dashboard data
      const response = await api.get<any>(ENDPOINTS.STUDENT.DASHBOARD);
      const {
        bus: busData,
        route: routeData,
        pickupPoint: pickupData,
        busLocation: dashboardBusLocation,
        eta: dashboardEta,
      } = response.data.data;

      setBus(busData);
      setRoute(routeData ? {
        ...routeData,
        pickupPoints: routeData.pickupPoints || routeData.stops || [],
      } : null);
      setPickupPoint(pickupData);

      if (dashboardBusLocation) {
        setBusLocation({
          lat: dashboardBusLocation.lat,
          lng: dashboardBusLocation.lng,
          speed: dashboardBusLocation.speed,
          heading: dashboardBusLocation.heading,
          timestamp: dashboardBusLocation.lastUpdated,
        });
      }

      if (dashboardEta) {
        setETA(dashboardEta);
      }

      // Get current location
      const hasPermission = await requestLocationPermissions();
      if (hasPermission) {
        const location = await getCurrentLocation();
        if (location) {
          setStudentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Fetch bus tracking data if bus is assigned
      if (busData?.id) {
        try {
          const trackingResponse = await api.get<any>(`${ENDPOINTS.STUDENT.TRACK_BUS}?busId=${busData.id}`);
          const { location, eta: etaData } = trackingResponse.data.data;

          if (location) {
            setBusLocation({
              lat: location.lat,
              lng: location.lng,
              speed: trackingResponse.data.data.speed,
              heading: trackingResponse.data.data.heading,
              timestamp: location.lastUpdated,
            });
          }

          if (etaData) {
            setETA(etaData);
          }
        } catch (trackingError) {
          console.warn('Bus tracking unavailable:', trackingError);
        }

        // Join bus socket room
        socketService.joinBusTracking(busData.id);
      }

      setInitialLoad(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  }, [setBus, setRoute, setPickupPoint, setStudentLocation, setBusLocation, setETA, setLoading, setError]);

  /**
   * Setup socket listeners
   */
  useEffect(() => {
    // Listen for bus location updates
    socketService.onBusLocation((data) => {
      setBusLocation({
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp,
      });
    });

    // Listen for ETA updates
    socketService.onETAUpdate((data) => {
      setETA(data.eta as ETAResult);
    });

    // Listen for bus arrival notification
    socketService.onBusArrival(() => {
      Toast.show({
        type: 'success',
        text1: 'Bus Arriving!',
        text2: 'Your bus is here. Please board now.',
      });
    });

    return () => {
      if (bus?.id) {
        socketService.leaveBusTracking(bus.id);
      }
    };
  }, [bus?.id, setBusLocation, setETA]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Fit map to show bus and student
   */
  useEffect(() => {
    if (busLocation && studentLocation && mapRef.current) {
      const coordinates = [
        { latitude: busLocation.lat, longitude: busLocation.lng },
        { latitude: studentLocation.lat, longitude: studentLocation.lng },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: CARD_MIN_HEIGHT + 50, left: 50 },
        animated: true,
      });
    }
  }, [busLocation, studentLocation]);

  /**
   * Format ETA display
   */
  const formatETA = () => {
    if (!eta) return 'Calculating...';
    if (eta.minutes <= 1) return 'Arriving now';
    return `${eta.minutes} mins`;
  };

  /**
   * Get route coordinates for polyline
   */
  const getRouteCoordinates = () => {
    if (!route?.pickupPoints) return [];
    return route.pickupPoints.map((point) => ({
      latitude: point.lat,
      longitude: point.lng,
    }));
  };

  /**
   * Center map on bus
   */
  const centerOnBus = () => {
    if (busLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: busLocation.lat,
        longitude: busLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  /**
   * Center map on student
   */
  const centerOnStudent = () => {
    if (studentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: studentLocation.lat,
        longitude: studentLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (isLoading && initialLoad) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your bus...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!bus) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="bus" size={48} color={colors.grey[400]} />
        <Text style={styles.errorTitle}>No Bus Assigned</Text>
        <Text style={styles.errorMessage}>
          You don't have an assigned bus yet. Please contact your administrator.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: studentLocation?.lat || pickupPoint?.lat || 0,
          longitude: studentLocation?.lng || pickupPoint?.lng || 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* Route Polyline */}
        {route?.pickupPoints && (
          <Polyline
            coordinates={getRouteCoordinates()}
            strokeColor={colors.map.routeLine}
            strokeWidth={3}
          />
        )}

        {/* Bus Marker */}
        {busLocation && (
          <BusMarker
            coordinate={{
              latitude: busLocation.lat,
              longitude: busLocation.lng,
            }}
            heading={busLocation.heading}
            speed={busLocation.speed}
            title={`Bus ${bus.registrationNumber}`}
          />
        )}

        {/* Student/Pickup Marker */}
        {studentLocation ? (
          <StudentMarker
            coordinate={{
              latitude: studentLocation.lat,
              longitude: studentLocation.lng,
            }}
            title="Your Location"
          />
        ) : pickupPoint ? (
          <StudentMarker
            coordinate={{
              latitude: pickupPoint.lat,
              longitude: pickupPoint.lng,
            }}
            title={pickupPoint.name}
          />
        ) : null}
      </MapView>

      {/* ETA Widget */}
      <View style={styles.etaContainer}>
        <View style={[styles.etaCard, isBusNearby() && styles.etaCardNear]}>
          <View style={styles.etaIconContainer}>
            <Ionicons
              name={isBusNearby() ? 'bus' : 'time'}
              size={24}
              color={isBusNearby() ? colors.success.main : colors.primary[500]}
            />
          </View>
          <View style={styles.etaTextContainer}>
            <Text style={styles.etaLabel}>
              {isBusNearby() ? 'Bus is here!' : 'Bus arriving in'}
            </Text>
            <Text style={styles.etaValue}>{formatETA()}</Text>
            {busLocation?.speed !== undefined && (
              <Text style={styles.etaSubtext}>
                Speed: {Math.round(busLocation.speed)} km/h
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnBus}>
          <Ionicons name="bus" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnStudent}>
          <Ionicons name="locate" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Card */}
      <Animated.View
        style={[styles.bottomCard, { height: cardAnimation }]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Bus Info Header */}
          <View style={styles.busHeader}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={28} color={colors.text.inverse} />
            </View>
            <View style={styles.busInfo}>
              <Text style={styles.busNumber}>{bus.registrationNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bus.status) }]}>
                <Text style={styles.statusText}>{bus.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchDashboardData}>
              <Ionicons name="refresh" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {/* Route Info */}
          {route && (
            <View style={styles.routeSection}>
              <Text style={styles.sectionLabel}>Route</Text>
              <Text style={styles.routeName}>{route.name}</Text>
              {route.description && (
                <Text style={styles.routeDescription}>{route.description}</Text>
              )}
            </View>
          )}

          {/* Pickup Point Info */}
          {pickupPoint && (
            <View style={styles.pickupSection}>
              <Text style={styles.sectionLabel}>Your Stop</Text>
              <View style={styles.pickupRow}>
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text style={styles.pickupName}>{pickupPoint.name}</Text>
              </View>
              {pickupPoint.arrivalTime && (
                <Text style={styles.arrivalTime}>
                  Scheduled: {pickupPoint.arrivalTime}
                </Text>
              )}
            </View>
          )}

          {/* ETA Details */}
          {eta && (
            <View style={styles.etaSection}>
              <Text style={styles.sectionLabel}>Journey Details</Text>
              <View style={styles.etaGrid}>
                <View style={styles.etaItem}>
                  <Text style={styles.etaItemValue}>{eta.factors.baseTime.toFixed(1)}m</Text>
                  <Text style={styles.etaItemLabel}>Travel Time</Text>
                </View>
                <View style={styles.etaItem}>
                  <Text style={styles.etaItemValue}>{eta.factors.stopTime.toFixed(1)}m</Text>
                  <Text style={styles.etaItemLabel}>Stops</Text>
                </View>
                <View style={styles.etaItem}>
                  <Text style={styles.etaItemValue}>
                    {Math.round(eta.factors.trafficFactor * 100)}%
                  </Text>
                  <Text style={styles.etaItemLabel}>Traffic</Text>
                </View>
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {eta.confidence}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

/**
 * Get status color
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'IN_SERVICE':
      return colors.success.main;
    case 'IDLE':
      return colors.warning.main;
    default:
      return colors.grey[500];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Loading & Error States
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.background.default,
  },
  errorTitle: {
    marginTop: spacing[4],
    ...typography.h4,
    color: colors.text.primary,
  },
  errorMessage: {
    marginTop: spacing[2],
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: 8,
  },
  retryText: {
    color: colors.text.inverse,
    ...typography.button,
  },

  // ETA Widget
  etaContainer: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  etaCardNear: {
    backgroundColor: colors.success.light,
  },
  etaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  etaTextContainer: {
    flex: 1,
  },
  etaLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  etaValue: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  etaSubtext: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: spacing[4],
    bottom: CARD_MIN_HEIGHT + spacing[6],
    zIndex: 10,
    gap: spacing[2],
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },

  // Bottom Card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grey[300],
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },

  // Bus Header
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  busIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  busInfo: {
    flex: 1,
  },
  busNumber: {
    ...typography.h5,
    color: colors.text.primary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 4,
    marginTop: spacing[1],
  },
  statusText: {
    ...typography.caption,
    color: colors.text.inverse,
    textTransform: 'uppercase',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  routeSection: {
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  pickupSection: {
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  etaSection: {
    marginBottom: spacing[4],
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  routeName: {
    ...typography.h6,
    color: colors.text.primary,
  },
  routeDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pickupName: {
    ...typography.h6,
    color: colors.text.primary,
  },
  arrivalTime: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },

  // ETA Grid
  etaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  etaItem: {
    alignItems: 'center',
    flex: 1,
  },
  etaItemValue: {
    ...typography.h5,
    color: colors.primary[500],
  },
  etaItemLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  confidenceText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[3],
    fontStyle: 'italic',
  },
});

export default HomeScreen;

