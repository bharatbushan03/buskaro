/**
 * Pickup Pin Marker Component
 * 
 * Draggable pin marker for pickup request location.
 * Shows pulse animation when active.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface PickupMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  isDragging?: boolean;
  isActive?: boolean;
  title?: string;
  onDragStart?: () => void;
  onDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
}

export const PickupMarker: React.FC<PickupMarkerProps> = ({
  coordinate,
  isDragging = false,
  isActive = false,
  title = 'Pickup Location',
  onDragStart,
  onDragEnd,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for active pickup
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive]);

  // Bounce animation when dragging
  useEffect(() => {
    Animated.spring(bounceAnim, {
      toValue: isDragging ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  }, [isDragging]);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const scale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => onDragEnd?.(e.nativeEvent.coordinate)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        {/* Pulse ring for active pickup */}
        {isActive && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.5],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          />
        )}

        {/* Bouncing marker */}
        <Animated.View
          style={[
            styles.marker,
            isDragging && styles.markerDragging,
            { transform: [{ translateY }, { scale }] },
          ]}
        >
          <Ionicons name="location" size={24} color={colors.text.inverse} />
        </Animated.View>

        {/* Shadow */}
        <Animated.View
          style={[
            styles.shadow,
            {
              transform: [{ scale: isDragging ? 0.8 : 1 }],
              opacity: isDragging ? 0.3 : 0.5,
            },
          ]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text.inverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  markerDragging: {
    backgroundColor: colors.primary[600],
    borderColor: colors.secondary[300],
  },
  shadow: {
    position: 'absolute',
    bottom: -10,
    width: 30,
    height: 10,
    borderRadius: 15,
    backgroundColor: '#000',
  },
});

export default PickupMarker;
