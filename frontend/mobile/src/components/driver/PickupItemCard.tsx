/**
 * Pickup Item Card Component
 * 
 * Individual pickup item showing:
 * - Distance to pickup
 * - Student name
 * - ETA
 * - Status indicator
 * - Quick action to mark as picked
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { PickupRequest } from '../../types';

interface PickupItemCardProps {
  pickup: PickupRequest & { distance?: number; etaMinutes?: number };
  isSelected: boolean;
  isNext: boolean;
  onPress: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

export const PickupItemCard: React.FC<PickupItemCardProps> = ({
  pickup,
  isSelected,
  isNext,
  onPress,
  onComplete,
  isCompleting,
}) => {
  const getStatusColor = () => {
    switch (pickup.status) {
      case 'PENDING': return '#FF9800';
      case 'CONFIRMED': return '#4CAF50';
      case 'ACTIVE': return '#2196F3';
      case 'COMPLETED': return '#9E9E9E';
      default: return colors.primary[500];
    }
  };

  const getStatusText = () => {
    switch (pickup.status) {
      case 'PENDING': return 'Waiting';
      case 'CONFIRMED': return 'Confirmed';
      case 'ACTIVE': return 'Active';
      case 'COMPLETED': return 'Done';
      default: return pickup.status;
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const isPending = pickup.status === 'PENDING' || pickup.status === 'CONFIRMED' || pickup.status === 'ACTIVE';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        pickup.status === 'COMPLETED' && styles.completed,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Next Indicator */}
      {isNext && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextText}>NEXT</Text>
        </View>
      )}

      {/* Status Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getStatusColor() }]}>
        <Ionicons name="person" size={20} color={colors.text.inverse} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.studentName} numberOfLines={1}>
            {pickup.studentName || 'Student'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.details}>
          {pickup.distance && (
            <View style={styles.detailItem}>
              <Ionicons name="navigate" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>{formatDistance(pickup.distance)}</Text>
            </View>
          )}
          
          {pickup.etaMinutes && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>{Math.round(pickup.etaMinutes)} min</Text>
            </View>
          )}
        </View>

        {pickup.address && (
          <Text style={styles.address} numberOfLines={1}>
            {pickup.address}
          </Text>
        )}
      </View>

      {/* Complete Action */}
      {isPending && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          disabled={isCompleting}
        >
          <Ionicons 
            name={isCompleting ? "sync" : "checkmark-circle"} 
            size={28} 
            color={colors.success.main} 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.primary[500],
    shadowOpacity: 0.2,
    elevation: 4,
  },
  completed: {
    opacity: 0.6,
    backgroundColor: colors.grey[50],
  },
  nextBadge: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  nextText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
    marginRight: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  studentName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing[2],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  details: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  address: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 12,
  },
  completeButton: {
    padding: spacing[2],
  },
});

export default PickupItemCard;
