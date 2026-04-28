/**
 * Pull To Refresh Component
 * 
 * Smooth pull-to-refresh with:
 * - Animated refresh indicator
 * - Progress-based scaling
 * - Smooth snap animations
 */

import React, { useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { Animated } from 'react-native';
import { colors } from '../../theme';

interface PullToRefreshProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  tintColor?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  refreshing,
  children,
  style,
  tintColor = colors.primary[500],
  ...scrollViewProps
}) => {
  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tintColor}
          colors={[tintColor]}
          progressBackgroundColor="#ffffff"
          progressViewOffset={0}
        />
      }
      style={style}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
};

export default PullToRefresh;
