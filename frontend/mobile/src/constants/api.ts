/**
 * API Constants
 * 
 * API configuration and endpoints.
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.buskaro.com',
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },

  // Student
  STUDENT: {
    DASHBOARD: '/api/students/dashboard',
    PICKUP: {
      REQUEST: '/api/students/pickup',
      STATUS: '/api/students/pickup/status',
    },
    ATTENDANCE: {
      TODAY: '/api/students/attendance/today',
      HISTORY: '/api/students/attendance/history',
      MARK: '/api/students/mark-attendance',
    },
    PAYMENTS: {
      LIST: '/api/students/payments',
      INTENT: '/api/payments/create-intent',
      VERIFY: '/api/payments/verify',
    },
  },

  // Driver
  DRIVER: {
    DASHBOARD: '/api/drivers/dashboard',
    UPDATE_LOCATION: '/api/drivers/location',
    PICKUPS: {
      ACCEPT: '/api/drivers/pickups/accept',
      NEARBY: '/api/drivers/pickups/nearby',
      CLUSTERS: '/api/drivers/pickups/clusters',
    },
    TRIP: {
      START: '/api/drivers/trip/start',
      END: '/api/drivers/trip/end',
    },
  },

  // Tracking
  TRACKING: {
    BUS_LOCATION: '/api/tracking/bus',
    ETA: '/api/tracking/eta',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
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
