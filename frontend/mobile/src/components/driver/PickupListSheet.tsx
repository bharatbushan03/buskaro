/**
 * Pickup List Sheet Component
 * 
 * Bottom sheet showing list of pickups:
 * - Sorted by nearest first
 * - Swipe to see more
 * - Tap to highlight on map
 * - Quick complete action
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { PickupRequest } from '../../types';
import { PickupItemCard } from './PickupItemCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 320;
const SHEET_MIN_HEIGHT = 80;

interface PickupListSheetProps {
  pickups: Array<PickupRequest & { distance?: number; etaMinutes?: number }>;
  selectedPickupId: string | null;
  onPickupPress: (pickupId: string) => void;
  onPickupComplete: (pickupId: string) => void;
  isCompletingPickup: boolean;
  show: boolean;
}

export const PickupListSheet: React.FC<PickupListSheetProps> = ({
  pickups,
  selectedPickupId,
  onPickupPress,
  onPickupComplete,
  isCompletingPickup,
  show,
}) => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: show ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [show]);

  // Get active pickups count
  const activePickups = pickups.filter(p => 
    ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(p.status)
  );

  // Get next pickup
  const nextPickupId = activePickups[0]?.id;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Drag Handle */}
      <View style={styles.dragHandle}>
        <View style={styles.dragIndicator} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Pickups</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activePickups.length}</Text>
          </View>
        </View>
        
        {activePickups.length > 0 && (
          <TouchableOpacity style={styles.optimizeButton}>
            <Ionicons name="refresh" size={16} color={colors.primary[500]} />
            <Text style={styles.optimizeText}>Optimize</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pickup List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {pickups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.grey[300]} />
            <Text style={styles.emptyTitle}>No Pickups</Text>
            <Text style={styles.emptyText}>
              New pickup requests will appear here
            </Text>
          </View>
        ) : (
          pickups.map((pickup) => (
            <PickupItemCard
              key={pickup.id}
              pickup={pickup}
              isSelected={selectedPickupId === pickup.id}
              isNext={pickup.id === nextPickupId}
              onPress={() => onPickupPress(pickup.id)}
              onComplete={() => onPickupComplete(pickup.id)}
              isCompleting={isCompletingPickup}
            />
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grey[300],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    ...typography.h5,
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  countText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  optimizeText: {
    ...typography.bodySmall,
    color: colors.primary[500],
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.grey[400],
    marginTop: spacing[4],
  },
  emptyText: {
    ...typography.body,
    color: colors.grey[400],
    textAlign: 'center',
    marginTop: spacing[2],
  },
});

export default PickupListSheet;
