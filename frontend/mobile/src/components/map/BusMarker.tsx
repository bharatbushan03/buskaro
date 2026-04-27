/**
 * Bus Marker Component
 * 
 * Animated bus marker for the map with heading indicator.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface BusMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  heading?: number;
  speed?: number;
  title?: string;
}

export const BusMarker: React.FC<BusMarkerProps> = ({
  coordinate,
  heading = 0,
  speed = 0,
  title = 'Bus',
}) => {
  const rotateAnim = useRef(new Animated.Value(heading)).current;

  // Animate rotation when heading changes
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: heading,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  }, [heading]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Determine color based on speed
  const getBusColor = () => {
    if (speed === 0) return colors.grey[500]; // Idle
    if (speed < 5) return colors.warning.main; // Slow
    return colors.map.busMarker; // Normal
  };

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
    >
      <View style={styles.container}>
        {/* Pulse animation for moving bus */}
        {speed > 0 && <View style={styles.pulseRing} />}
        
        {/* Main marker */}
        <Animated.View
          style={[
            styles.marker,
            { backgroundColor: getBusColor() },
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <Ionicons name="bus" size={16} color={colors.text.inverse} />
        </Animated.View>
        
        {/* Heading indicator */}
        <View style={[styles.headingIndicator, { transform: [{ rotate: `${heading}deg` }] }]}>
          <View style={styles.headingArrow} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.map.busMarker,
    opacity: 0.3,
    transform: [{ scale: 1 }],
  },
  headingIndicator: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
  },
  headingArrow: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.map.busMarker,
  },
});

export default BusMarker;
