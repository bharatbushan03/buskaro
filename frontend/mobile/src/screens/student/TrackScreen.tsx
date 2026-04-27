/**
 * Track Screen - Bus tracking with map
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const TrackScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Bus</Text>
        <Text style={styles.subtitle}>Map view coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  content: { flex: 1, padding: spacing[6], justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing[4] },
  subtitle: { ...typography.body, color: colors.text.secondary },
});
