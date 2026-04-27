/**
 * Pickup Bottom Sheet Component
 * 
 * Shows pickup details and confirmation actions.
 * Two modes: confirm pickup OR show active pickup status.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { usePickupStore } from '../../store/pickup.store';
import { PickupRequest } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 280;
const SHEET_MIN_HEIGHT = 100;

interface PickupBottomSheetProps {
  onConfirmPickup: () => void;
  onCancelPickup: () => void;
  onClose: () => void;
}

export const PickupBottomSheet: React.FC<PickupBottomSheetProps> = ({
  onConfirmPickup,
  onCancelPickup,
  onClose,
}) => {
  const {
    pickup,
    pinLocation,
    address,
    isSubmitting,
    isCancelling,
    showBottomSheet,
    hasActivePickup,
    canRequestPickup,
    getStatusColor,
    getStatusText,
    resetPin,
  } = usePickupStore();

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Slide animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: showBottomSheet ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [showBottomSheet]);

  // Render active pickup status
  const renderActivePickup = () => {
    if (!pickup) return null;

    const statusColor = getStatusColor();
    const statusText = getStatusText();

    return (
      <View style={styles.container}>
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>

        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{pickup.status}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.grey[500]} />
          </TouchableOpacity>
        </View>

        {/* Status Message */}
        <View style={styles.statusContent}>
          <Ionicons
            name={getStatusIcon(pickup.status)}
            size={48}
            color={statusColor}
            style={styles.statusIcon}
          />
          <Text style={styles.statusTitle}>{statusText}</Text>
          
          {pickup.driver && (
            <View style={styles.driverInfo}>
              <Ionicons name="person" size={16} color={colors.text.secondary} />
              <Text style={styles.driverName}>{pickup.driver.name}</Text>
            </View>
          )}

          {pickup.estimatedArrivalTime && (
            <Text style={styles.etaText}>
              ETA: {formatTime(pickup.estimatedArrivalTime)}
            </Text>
          )}
        </View>

        {/* Cancel Button */}
        {['PENDING', 'CONFIRMED'].includes(pickup.status) && (
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
            onPress={onCancelPickup}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.error.main} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={colors.error.main} />
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render confirm pickup form
  const renderConfirmPickup = () => {
    return (
      <View style={styles.container}>
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Pickup Location</Text>
          <TouchableOpacity onPress={() => { resetPin(); onClose(); }}>
            <Ionicons name="close" size={24} color={colors.grey[500]} />
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <View style={styles.coordinatesRow}>
            <Ionicons name="location" size={20} color={colors.primary[500]} />
            <Text style={styles.coordinates}>
              {pinLocation?.lat.toFixed(6)}, {pinLocation?.lng.toFixed(6)}
            </Text>
          </View>
          
          {address ? (
            <Text style={styles.address}>{address}</Text>
          ) : (
            <View style={styles.addressLoading}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.addressLoadingText}>Getting address...</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.adjustButton, isSubmitting && styles.buttonDisabled]}
            onPress={() => resetPin()}
            disabled={isSubmitting}
          >
            <Text style={styles.adjustButtonText}>Adjust Pin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!canRequestPickup() || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={onConfirmPickup}
            disabled={!canRequestPickup() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.sheet,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      {hasActivePickup() ? renderActivePickup() : renderConfirmPickup()}
    </Animated.View>
  );
};

/**
 * Get status icon
 */
const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case 'CONFIRMED':
      return 'checkmark-circle';
    case 'ACTIVE':
      return 'navigate';
    case 'COMPLETED':
      return 'flag';
    case 'EXPIRED':
    case 'CANCELLED':
      return 'close-circle';
    default:
      return 'time';
  }
};

/**
 * Format time
 */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  sheet: {
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
  container: {
    flex: 1,
    padding: spacing[6],
  },
  dragHandle: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grey[300],
  },

  // Active Pickup Styles
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: spacing[1],
  },
  statusContent: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  statusIcon: {
    marginBottom: spacing[3],
  },
  statusTitle: {
    ...typography.h5,
    color: colors.text.primary,
    textAlign: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  driverName: {
    ...typography.body,
    color: colors.text.secondary,
  },
  etaText: {
    ...typography.body,
    color: colors.primary[500],
    marginTop: spacing[2],
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: 12,
    backgroundColor: colors.error.light,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.error.main,
  },

  // Confirm Pickup Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.h5,
    color: colors.text.primary,
  },
  locationInfo: {
    marginBottom: spacing[6],
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  coordinates: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  address: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addressLoadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  adjustButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: 12,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
  },
  adjustButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: 12,
    backgroundColor: colors.primary[500],
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default PickupBottomSheet;
