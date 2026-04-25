/**
 * Socket.IO Event Constants
 * 
 * Centralized event definitions for real-time communication.
 * Using constants prevents typos and enables IDE autocomplete.
 */

// ==================== DRIVER EVENTS ====================
export const DriverEvents = {
  // Driver emits
  LOCATION_UPDATE: 'driver:location-update',
  STATUS_CHANGE: 'driver:status-change',
  EMERGENCY_ALERT: 'driver:emergency-alert',
  
  // Trip Management
  TRIP_STARTED: 'trip:started',
  TRIP_ENDED: 'trip:ended',
  TRIP_PAUSED: 'trip:paused',
  TRIP_RESUMED: 'trip:resumed',
  
  // Duty
  GO_ON_DUTY: 'driver:on-duty',
  GO_OFF_DUTY: 'driver:off-duty',
  
  // Driver receives
  ROUTE_ASSIGNED: 'driver:route-assigned',
  STUDENT_BOARDED: 'driver:student-boarded',
  SYSTEM_ALERT: 'driver:system-alert',
} as const;

// ==================== STUDENT EVENTS ====================
export const StudentEvents = {
  // Student emits
  SUBSCRIBE_BUS: 'student:subscribe-bus',
  UNSUBSCRIBE_BUS: 'student:unsubscribe-bus',
  REQUEST_ETA: 'student:request-eta',
  
  // Student receives
  BUS_LOCATION: 'student:bus-location',
  BUS_ETA: 'student:bus-eta',
  BUS_STATUS: 'student:bus-status',
  BUS_ARRIVAL: 'student:bus-arrival',
  TRIP_ENDED: 'student:trip-ended',
} as const;

// ==================== ADMIN EVENTS ====================
export const AdminEvents = {
  // Admin emits
  BROADCAST_ALERT: 'admin:broadcast-alert',
  REQUEST_BUS_STATUS: 'admin:request-bus-status',
  
  // Admin receives
  BUS_LOCATION_GLOBAL: 'admin:bus-location-global',
  DRIVER_STATUS: 'admin:driver-status',
  SYSTEM_METRICS: 'admin:system-metrics',
  ALERT_TRIGGERED: 'admin:alert-triggered',
} as const;

// ==================== SYSTEM EVENTS ====================
export const SystemEvents = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Errors
  ERROR: 'error',
  VALIDATION_ERROR: 'validation:error',
  AUTH_ERROR: 'auth:error',
  
  // Acknowledgments
  ACK: 'ack',
} as const;

// ==================== ROOM NAMESPACES ====================
export const SocketRooms = {
  // Bus rooms: bus:{busId}
  BUS_PREFIX: 'bus:',
  
  // Driver rooms: driver:{driverId}
  DRIVER_PREFIX: 'driver:',
  
  // Route rooms: route:{routeId}
  ROUTE_PREFIX: 'route:',
  
  // Global admin room
  ADMIN_GLOBAL: 'admin:global',
  
  // System announcements
  BROADCAST_ALL: 'broadcast:all',
} as const;

// Helper functions to generate room names
export const getBusRoom = (busId: string): string => `${SocketRooms.BUS_PREFIX}${busId}`;
export const getDriverRoom = (driverId: string): string => `${SocketRooms.DRIVER_PREFIX}${driverId}`;
export const getRouteRoom = (routeId: string): string => `${SocketRooms.ROUTE_PREFIX}${routeId}`;

// Combined export
export const SocketEvents = {
  Driver: DriverEvents,
  Student: StudentEvents,
  System: SystemEvents,
};
