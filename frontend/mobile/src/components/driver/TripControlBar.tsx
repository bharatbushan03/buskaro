/**
 * Trip Control Bar Component
 * 
 * Large, driver-friendly buttons for:
 * - Start Trip
 * - End Trip
 * - Trip status indicator
 * 
 * Minimal text, clear colors, large touch targets
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { TripStatus } from '../../store/driver.store';

interface TripControlBarProps {
  status: TripStatus;
  pickupCount: number;
  isStarting: boolean;
  isEnding: boolean;
  onStartTrip: () => void;
  onEndTrip: () => void;
}

export const TripControlBar: React.FC<TripControlBarProps> = ({
  status,
  pickupCount,
  isStarting,
  isEnding,
  onStartTrip,
  onEndTrip,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'IDLE':
        return {
          color: colors.grey[400],
          bgColor: colors.grey[100],
          icon: 'car' as const,
          text: 'IDLE',
        };
      case 'IN_SERVICE':
        return {
          color: colors.success.main,
          bgColor: colors.success.light,
          icon: 'navigate' as const,
          text: 'IN SERVICE',
        };
      case 'COMPLETED':
        return {
          color: colors.info.main,
          bgColor: colors.info.light,
          icon: 'flag' as const,
          text: 'COMPLETED',
        };
      default:
        return {
          color: colors.grey[400],
          bgColor: colors.grey[100],
          icon: 'car' as const,
          text: 'IDLE',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      {/* Status Indicator */}
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
        {status === 'IN_SERVICE' && (
          <View style={styles.pulseDot} />
        )}
      </View>

      {/* Pickup Count */}
      <View style={styles.pickupInfo}>
        <Ionicons name="people" size={16} color={colors.text.secondary} />
        <Text style={styles.pickupCount}>{pickupCount}</Text>
        <Text style={styles.pickupLabel}>pickups</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {status === 'IDLE' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={onStartTrip}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="play" size={24} color={colors.text.inverse} />
                <Text style={styles.actionButtonText}>START TRIP</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {status === 'IN_SERVICE' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={onEndTrip}
            disabled={isEnding}
          >
            {isEnding ? (
              <ActivityIndicator color={colors.error.main} />
            ) : (
              <>
                <Ionicons name="flag" size={24} color={colors.error.main} />
                <Text style={[styles.actionButtonText, { color: colors.error.main }]}>
                  END TRIP
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {status === 'COMPLETED' && (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
            <Text style={[styles.actionButtonText, { color: colors.success.main }]}>
              TRIP ENDED
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.grey[200],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginLeft: spacing[1],
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.grey[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  pickupCount: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pickupLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  startButton: {
    backgroundColor: colors.success.main,
    shadowColor: colors.success.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  endButton: {
    backgroundColor: colors.error.light,
    borderWidth: 2,
    borderColor: colors.error.main,
  },
  completedButton: {
    backgroundColor: colors.success.light,
    borderWidth: 2,
    borderColor: colors.success.main,
  },
});

export default TripControlBar;
