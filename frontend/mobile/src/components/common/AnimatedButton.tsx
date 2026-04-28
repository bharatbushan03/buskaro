/**
 * Animated Button Component
 * 
 * Button with micro-interactions:
 * - Scale animation on press
 * - Loading spinner
 * - Success/error feedback
 * - Ripple effect (optional)
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  success = false,
  error = false,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [showFeedback, setShowFeedback] = React.useState(false);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [scaleAnim]);

  React.useEffect(() => {
    if (success || error) {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: showFeedback
            ? success
              ? colors.success.main
              : error
              ? colors.error.main
              : colors.primary[500]
            : colors.primary[500],
          text: colors.text.inverse,
          border: 'transparent',
        };
      case 'secondary':
        return {
          background: colors.grey[100],
          text: colors.text.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          background: colors.error.main,
          text: colors.text.inverse,
          border: 'transparent',
        };
      case 'outline':
        return {
          background: 'transparent',
          text: colors.primary[500],
          border: colors.primary[500],
        };
      case 'ghost':
        return {
          background: 'transparent',
          text: colors.text.secondary,
          border: 'transparent',
        };
      default:
        return {
          background: colors.primary[500],
          text: colors.text.inverse,
          border: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: spacing[2],
          fontSize: 14,
          iconSize: 16,
        };
      case 'md':
        return {
          padding: spacing[3],
          fontSize: 16,
          iconSize: 20,
        };
      case 'lg':
        return {
          padding: spacing[4],
          fontSize: 18,
          iconSize: 24,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const feedbackIcon = success ? 'checkmark' : error ? 'close' : null;
  const showIcon = showFeedback && feedbackIcon ? feedbackIcon : icon;
  const showTitle = showFeedback ? (success ? 'Done!' : error ? 'Failed' : title) : title;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.background,
            borderColor: variantStyles.border,
            borderWidth: variant === 'outline' ? 2 : 0,
            paddingVertical: sizeStyles.padding,
            paddingHorizontal: sizeStyles.padding * 2,
            opacity: disabled || loading ? 0.6 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <View style={styles.content}>
            <ActivityIndicator color={variantStyles.text} size="small" />
            <Text style={[styles.text, { color: variantStyles.text, marginLeft: spacing[2] }]}>
              Loading...
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.content,
              { flexDirection: iconPosition === 'left' ? 'row' : 'row-reverse' },
            ]}
          >
            {showIcon && (
              <Ionicons
                name={showIcon}
                size={sizeStyles.iconSize}
                color={variantStyles.text}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.text,
                {
                  color: variantStyles.text,
                  fontSize: sizeStyles.fontSize,
                  marginLeft: iconPosition === 'left' && showIcon ? spacing[2] : 0,
                  marginRight: iconPosition === 'right' && showIcon ? spacing[2] : 0,
                },
              ]}
            >
              {showTitle}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  icon: {
    marginHorizontal: spacing[1],
  },
});

export default AnimatedButton;
