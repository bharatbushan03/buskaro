/**
 * BusKaro Mobile App
 * 
 * Main entry point for the React Native application.
 * Supports both Student and Driver roles.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth.store';
import { socketService } from './src/services/socket.service';
import { initializeLocationTracking } from './src/services/location.service';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { isAuthenticated, user, token } = useAuthStore();

  useEffect(() => {
    // Initialize socket connection if authenticated
    if (isAuthenticated && token) {
      socketService.connect(token);

      // Initialize location tracking for drivers
      if (user?.role === 'DRIVER') {
        initializeLocationTracking();
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token, user?.role]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <RootNavigator />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
