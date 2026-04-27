/**
 * Root Navigator
 * 
 * Main navigation container that decides between Auth and App flows.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { DriverNavigator } from './DriverNavigator';
import { UserRole } from '../types';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    // Show splash screen while loading
    return null; // Or return a LoadingScreen component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // App Flow based on role
          user?.role === UserRole.STUDENT ? (
            <Stack.Screen name="StudentMain" component={StudentNavigator} />
          ) : user?.role === UserRole.DRIVER ? (
            <Stack.Screen name="DriverMain" component={DriverNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
