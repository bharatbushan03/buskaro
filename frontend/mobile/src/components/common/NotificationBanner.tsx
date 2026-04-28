/**
 * Notification Banner Component
 * 
 * In-app notification with smooth entry/exit animations:
 * - Success, error, warning, info variants
 * - Auto-dismiss with progress bar
 * - Swipe to dismiss
 * - Icon + title + message
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationBannerProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const config = {
  success: {
    icon: 'checkmark-circle',
    backgroundColor: colors.success.light,
    borderColor: colors.success.main,
    textColor: colors.success.dark,
  },
  error: {
    icon: 'close-circle',
    backgroundColor: colors.error.light,
    borderColor: colors.error.main,
    textColor: colors.error.dark,
  },
  warning: {
    icon: 'warning',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    textColor: '#92400E',
  },
  info: {
    icon: 'information-circle',
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
    textColor: colors.primary[700],
  },
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
  actionLabel,
  onAction,
}) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;

  const { icon, backgroundColor, borderColor, textColor } = config[type];

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateY, opacity]);

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < 0; // Only respond to upward swipes
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor,
          borderLeftColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon as any} size={24} color={borderColor} />
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: textColor }]}>{message}</Text>
          )}
          {actionLabel && onAction && (
            <TouchableOpacity onPress={onAction} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: borderColor }]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: borderColor,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    margin: spacing[4],
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    gap: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 15,
  },
  message: {
    ...typography.bodySmall,
    marginTop: spacing[1],
    opacity: 0.8,
  },
  actionButton: {
    marginTop: spacing[2],
  },
  actionText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing[1],
  },
  progressBar: {
    height: 3,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default NotificationBanner;
