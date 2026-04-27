/**
 * Register Screen
 * 
 * User registration screen.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '../../types';
import { colors, spacing, typography } from '../../theme';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');

  const handleRegister = async () => {
    if (!name || !email || !password) return;

    try {
      await register({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join BusKaro today</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'STUDENT' && styles.roleButtonActive]}
              onPress={() => setRole('STUDENT')}
            >
              <Text style={[styles.roleText, role === 'STUDENT' && styles.roleTextActive]}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'DRIVER' && styles.roleButtonActive]}
              onPress={() => setRole('DRIVER')}
            >
              <Text style={[styles.roleText, role === 'DRIVER' && styles.roleTextActive]}>
                Driver
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError();
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              clearError();
            }}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing[6],
    flexGrow: 1,
  },
  title: {
    ...typography.h1,
    color: colors.primary[500],
    textAlign: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.h5,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  form: {
    gap: spacing[4],
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  roleText: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  roleTextActive: {
    color: colors.text.inverse,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.grey[300],
    borderRadius: 8,
    paddingHorizontal: spacing[4],
    fontSize: 16,
    backgroundColor: colors.background.default,
  },
  button: {
    height: 48,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error.light,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error.main,
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  linkText: {
    color: colors.text.secondary,
  },
  linkHighlight: {
    color: colors.primary[500],
    fontWeight: '600',
  },
});
