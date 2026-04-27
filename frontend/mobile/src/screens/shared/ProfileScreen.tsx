/**
 * Profile Screen (Shared between Student and Driver)
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing, typography } from '../../theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name}</Text>
          
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
          
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
    padding: spacing[6],
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing[6],
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[4],
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
  },
  value: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  logoutButton: {
    backgroundColor: colors.error.main,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
