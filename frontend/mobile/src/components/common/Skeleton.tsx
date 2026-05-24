/**
 * Skeleton Loading Component
 * 
 * Animated shimmer placeholders for loading states:
 * - SkeletonCard
 * - SkeletonText
 * - SkeletonCircle
 * - SkeletonList
 */

import React from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['#E1E9EE', '#F2F8FC', '#E1E9EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton width={60} height={60} borderRadius={30} style={styles.mb12} />
    <Skeleton width="80%" height={20} style={styles.mb8} />
    <Skeleton width="60%" height={16} borderRadius={4} />
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.listItem}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.listContent}>
          <Skeleton width="70%" height={18} style={styles.mb8} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    ))}
  </View>
);

export const SkeletonMap: React.FC = () => (
  <View style={styles.map}>
    <View style={styles.mapOverlay}>
      <SkeletonCard style={styles.mapCard} />
      <Skeleton width={48} height={48} borderRadius={24} style={styles.mapButton} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  shimmer: {
    width: 200,
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mb12: {
    marginBottom: 12,
  },
  mb8: {
    marginBottom: 8,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listContent: {
    flex: 1,
  },
  map: {
    height: 400,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
  },
  mapCard: {
    width: 200,
  },
  mapButton: {
    alignSelf: 'flex-end',
  },
});

export default Skeleton;
