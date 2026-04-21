/**
 * Application Constants
 * 
 * Global constants used across the application.
 */

// API Configuration
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Bus tracking constants
export const BUS_TRACKING = {
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds
  LOCATION_STALENESS_THRESHOLD: 60000, // 1 minute
  ARRIVAL_NOTIFICATION_RADIUS: 500, // meters
  ARRIVAL_NOTIFICATION_TIME: 5, // minutes before arrival
} as const;

// Attendance constants
export const ATTENDANCE = {
  VERIFICATION_RADIUS: 200, // meters from pickup point
  MARKING_WINDOW_MINUTES: 30, // minutes before/after scheduled time
  PIN_EXPIRY_MINUTES: 10,
  NFC_TIMEOUT_SECONDS: 5,
} as const;

// Payment constants
export const PAYMENT = {
  CURRENCY: 'INR',
  MINIMUM_AMOUNT: 100,
  LATE_FEE_CAP_PERCENTAGE: 50,
  PAYMENT_LINK_EXPIRY_HOURS: 48,
} as const;

// Notification constants
export const NOTIFICATION = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  BATCH_SIZE: 100,
  QUIET_HOURS_DEFAULT_START: '22:00',
  QUIET_HOURS_DEFAULT_END: '07:00',
} as const;

// Validation constants
export const VALIDATION = {
  MAX_EMAIL_LENGTH: 255,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  OTP_LENGTH: 6,
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  BUS_LOCATION: 300, // 5 minutes
  ROUTE_DATA: 1800, // 30 minutes
  PICKUP_POINTS: 3600, // 1 hour
  ATTENDANCE_SUMMARY: 300, // 5 minutes
} as const;

// Error codes for client reference
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;
