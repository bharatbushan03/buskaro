/**
 * Driver Map View Component
 * 
 * Navigation-focused map showing:
 * - Driver location with heading
 * - Route polyline
 * - Pickup point markers
 * - Next pickup highlight
 * - Auto-center on driver
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface DriverMapViewProps {
  driverLocation: {
    lat: number;
    lng: number;
    heading?: number;
  } | null;
  pickups: Array<{
    id: string;
    lat: number;
    lng: number;
    status: string;
    studentName?: string;
  }>;
  routePath: Array<{ latitude: number; longitude: number }> | null;
  selectedPickupId: string | null;
  onPickupPress: (pickupId: string) => void;
  followDriver?: boolean;
}

export interface DriverMapViewRef {
  centerOnDriver: () => void;
  centerOnPickup: (lat: number, lng: number) => void;
  fitToCoordinates: (coordinates: LatLng[]) => void;
}

export const DriverMapView = forwardRef<DriverMapViewRef, DriverMapViewProps>(
  ({ 
    driverLocation, 
    pickups, 
    routePath, 
    selectedPickupId,
    onPickupPress,
    followDriver = true 
  }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      centerOnDriver: () => {
        if (driverLocation && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
      },
      
      centerOnPickup: (lat: number, lng: number) => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 500);
        }
      },
      
      fitToCoordinates: (coordinates: LatLng[]) => {
        if (mapRef.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }
      },
    }));

    // Auto-center on driver when location updates
    useEffect(() => {
      if (followDriver && driverLocation && mapRef.current) {
        mapRef.current.animateCamera({
          center: {
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
          },
          heading: driverLocation.heading || 0,
          pitch: 45,
          zoom: 17,
        }, { duration: 500 });
      }
    }, [driverLocation, followDriver]);

    const getPickupIcon = (status: string) => {
      switch (status) {
        case 'PENDING': return 'time' as const;
        case 'CONFIRMED': return 'checkmark-circle' as const;
        case 'ACTIVE': return 'navigate' as const;
        case 'COMPLETED': return 'flag' as const;
        default: return 'location' as const;
      }
    };

    const getPickupColor = (status: string, isSelected: boolean) => {
      if (isSelected) return colors.primary[500];
      
      switch (status) {
        case 'PENDING': return '#FF9800'; // Orange
        case 'CONFIRMED': return '#4CAF50'; // Green
        case 'ACTIVE': return '#2196F3'; // Blue
        case 'COMPLETED': return '#9E9E9E'; // Grey
        default: return colors.primary[500];
      }
    };

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: driverLocation?.lat || 0,
            longitude: driverLocation?.lng || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsTraffic={true}
          mapType="standard"
        >
          {/* Route Polyline */}
          {routePath && routePath.length > 0 && (
            <Polyline
              coordinates={routePath}
              strokeColor={colors.primary[500]}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}

          {/* Driver Location Marker */}
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.lat,
                longitude: driverLocation.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={driverLocation.heading || 0}
              flat={true}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="navigate" size={20} color={colors.text.inverse} />
              </View>
            </Marker>
          )}

          {/* Pickup Markers */}
          {pickups.map((pickup) => {
            const isSelected = selectedPickupId === pickup.id;
            const iconName = getPickupIcon(pickup.status);
            const color = getPickupColor(pickup.status, isSelected);
            
            return (
              <Marker
                key={pickup.id}
                coordinate={{
                  latitude: pickup.lat,
                  longitude: pickup.lng,
                }}
                onPress={() => onPickupPress(pickup.id)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.pickupMarkerContainer}>
                  {isSelected && (
                    <View style={styles.selectedRing} />
                  )}
                  <View style={[styles.pickupMarker, { backgroundColor: color }]}>
                    <Ionicons name={iconName} size={18} color={colors.text.inverse} />
                  </View>
                  <View style={[styles.pickupTail, { backgroundColor: color }]} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text.inverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pickupMarkerContainer: {
    alignItems: 'center',
  },
  selectedRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    top: -8,
  },
  pickupMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text.inverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  pickupTail: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    marginTop: -8,
    zIndex: 5,
  },
});

export default DriverMapView;
