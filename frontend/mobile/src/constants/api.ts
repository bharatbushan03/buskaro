/**
 * API Constants
 * 
 * API configuration and endpoints.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 5000;

function getDevServerHost(): string | undefined {
  const constants = Constants as any;
  const hostUri =
    Constants.expoConfig?.hostUri ||
    constants.manifest?.debuggerHost ||
    constants.manifest2?.extra?.expoClient?.hostUri;

  return typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
}

function getDefaultBaseUrl(): string {
  const devServerHost = getDevServerHost();

  if (devServerHost) {
    return `http://${devServerHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl(),
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },

  // Student
  STUDENT: {
    DASHBOARD: '/api/v1/students/dashboard',
    TRACK_BUS: '/api/v1/students/track-bus',
    PICKUP: {
      REQUEST: '/api/v1/pickups/students/pin-location',
      ACTIVE_PIN: '/api/v1/pickups/students/my-pin',
      CANCEL_PIN: (id: string) => `/api/v1/pickups/students/cancel-pin/${id}`,
      STATUS: '/api/v1/students/pickup/active',
    },
    ATTENDANCE: {
      TODAY: '/api/v1/attendance/students/today',
      HISTORY: '/api/v1/attendance/students/history',
      MARK: '/api/v1/attendance/students/mark',
    },
    PAYMENTS: {
      LIST: '/api/v1/payments/my-fees',
      INTENT: '/api/v1/payments/initiate',
      VERIFY: '/api/v1/payments/verify',
    },
  },

  // Driver
  DRIVER: {
    DASHBOARD: '/api/v1/drivers/dashboard',
    UPDATE_LOCATION: '/api/v1/drivers/location',
    TRIP_STATUS: '/api/v1/drivers/trip/status',
    ROUTE: '/api/v1/drivers/route',
    PICKUPS: {
      ACCEPT: '/api/v1/drivers/pickups/:id/accept',
      NEARBY: '/api/v1/drivers/pickups/nearby',
      CLUSTERS: '/api/v1/drivers/pickups/clusters',
      COMPLETE: (id: string) => `/api/v1/drivers/pickups/${id}/complete`,
    },
    TRIP: {
      START: '/api/v1/drivers/start-trip',
      END: '/api/v1/drivers/end-trip',
    },
  },

  // Tracking
  TRACKING: {
    BUS_LOCATION: '/api/v1/tracking/bus',
    ETA: '/api/v1/tracking/eta',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications/',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/mark-all-read',
  },
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Driver events
  DRIVER: {
    LOCATION_UPDATE: 'driver:location-update',
    PICKUP_ACCEPT: 'driver:pickup-accept',
    PICKUP_REJECT: 'driver:pickup-reject',
    TRIP_START: 'driver:trip-start',
    TRIP_END: 'driver:trip-end',
    PICKUP_CLUSTER_UPDATED: 'driver:pickup-cluster-updated',
    ROUTE_OPTIMIZED: 'driver:route-optimized',
  },

  // Student events
  STUDENT: {
    BUS_LOCATION: 'student:bus-location',
    BUS_ETA: 'student:bus-eta',
    BUS_STATUS: 'student:bus-status',
    BUS_ARRIVAL: 'student:bus-arrival',
    TRIP_ENDED: 'student:trip-ended',
    ETA_UPDATE: 'student:eta-update',
    ATTENDANCE_MARKED: 'student:attendance-marked',
    PICKUP_CONFIRMED: 'student:pickup-confirmed',
    PICKUP_EXPIRED: 'student:pickup-expired',
    PAYMENT_SUCCESS: 'student:payment-success',
    PAYMENT_FAILED: 'student:payment-failed',
  },

  // Admin events
  ADMIN: {
    BUS_LOCATION_GLOBAL: 'admin:bus-location-global',
    DRIVER_STATUS: 'admin:driver-status',
    SYSTEM_METRICS: 'admin:system-metrics',
    ALERT_TRIGGERED: 'admin:alert-triggered',
    DASHBOARD_UPDATE: 'admin:dashboard-update',
    ATTENDANCE_UPDATE: 'admin:attendance-update',
  },

  // Common
  NOTIFICATION: 'notification:new',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@buskaro/access_token',
  REFRESH_TOKEN: '@buskaro/refresh_token',
  USER_DATA: '@buskaro/user_data',
  SETTINGS: '@buskaro/settings',
  ONBOARDING_COMPLETED: '@buskaro/onboarding_completed',
} as const;
