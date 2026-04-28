/**
 * Error State Component
 * 
 * Beautiful error/empty states:
 * - Network error with retry
 * - Empty state (no data)
 * - 404 not found
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface ErrorStateProps {
  variant: 'network' | 'empty' | 'notfound' | 'error';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const defaultContent = {
  network: {
    icon: 'cloud-offline',
    title: 'Connection Lost',
    message: 'Please check your internet connection and try again.',
    actionLabel: 'Try Again',
  },
  empty: {
    icon: 'inbox',
    title: 'Nothing Here',
    message: 'There are no items to display at the moment.',
    actionLabel: null,
  },
  notfound: {
    icon: 'search',
    title: 'Not Found',
    message: 'The item you are looking for does not exist.',
    actionLabel: 'Go Back',
  },
  error: {
    icon: 'alert-circle',
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant,
  title,
  message,
  onRetry,
  onAction,
  actionLabel,
}) => {
  const content = defaultContent[variant];
  const displayTitle = title || content.title;
  const displayMessage = message || content.message;
  const displayAction = actionLabel || content.actionLabel;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={content.icon as any}
          size={64}
          color={colors.grey[300]}
        />
      </View>

      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.message}>{displayMessage}</Text>

      {displayAction && (onRetry || onAction) && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry || onAction}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={colors.text.inverse}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>{displayAction}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={64} color={colors.grey[300]} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: spacing[2],
  },
  buttonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default ErrorState;
