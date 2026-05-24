/**
 * Type Definitions
 * 
 * Shared TypeScript types for the mobile application.
 */

// User Types
export type UserRole = 'STUDENT' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
}

export interface Student extends User {
  role: 'STUDENT';
  studentId: string;
  busId?: string;
  routeId?: string;
  pickupPointId?: string;
  pickupPoint?: PickupPoint;
}

export interface Driver extends User {
  role: 'DRIVER';
  driverId: string;
  busId?: string;
  licenseNumber?: string;
  isActive: boolean;
}

// Bus Types
export interface Bus {
  id: string;
  registrationNumber: string;
  model?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  currentLocation?: {
    lat: number;
    lng: number;
    speed?: number;
    timestamp: string;
  };
}

// Route Types
export interface Route {
  id: string;
  name: string;
  description?: string;
  startPoint: string;
  endPoint: string;
  pickupPoints: PickupPoint[];
  estimatedDuration?: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sequenceOrder: number;
  arrivalTime?: string;
}

// Pickup Request Types
export type PickupStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'CONFIRMED' | 'ACTIVE';

export interface PickupRequest {
  id: string;
  studentId: string;
  studentName?: string;
  driverId?: string;
  driver?: { id: string; name: string; phone?: string };
  driverName?: string;
  lat: number;
  lng: number;
  status: PickupStatus;
  note?: string;
  address?: string;
  estimatedArrivalTime?: string;
  expiresAt: string;
  createdAt: string;
  distance?: number;
  etaMinutes?: number;
}

export interface Trip {
  id: string;
  driverId: string;
  busId: string;
  routeId: string;
  status: 'IDLE' | 'IN_SERVICE' | 'COMPLETED';
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupCluster {
  id: string;
  center: {
    lat: number;
    lng: number;
  };
  pickupCount: number;
  radius: number;
  students: Array<{
    studentId: string;
    name: string;
    distance: number;
    expiryTime: string;
  }>;
  recommendedAction: 'pickup' | 'skip';
  etaMinutes: number;
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  type: 'FEE' | 'FINE' | 'OTHER';
  createdAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

// Attendance Types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: string;
  studentId: string;
  busId: string;
  date: string;
  status: AttendanceStatus;
  markedAt?: string;
  markedBy?: 'SYSTEM' | 'DRIVER' | 'ADMIN';
  location?: {
    lat: number;
    lng: number;
  };
}

// ETA Types
export interface ETAResult {
  minutes: number;
  seconds: number;
  confidence: 'high' | 'medium' | 'low';
  factors: {
    baseTime: number;
    stopTime: number;
    trafficFactor: number;
    adjustedTime: number;
  };
  updatedAt: string;
}

// Notification Types
export type NotificationType = 
  | 'PAYMENT' 
  | 'PICKUP' 
  | 'BUS' 
  | 'ATTENDANCE' 
  | 'SYSTEM';

export type NotificationStatus = 'READ' | 'UNREAD';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  readAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  StudentMain: undefined;
  DriverMain: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type StudentTabParamList = {
  Home: undefined;
  Track: undefined;
  Pickup: undefined;
  Payments: undefined;
  Profile: undefined;
};

export type DriverTabParamList = {
  Dashboard: undefined;
  Pickups: undefined;
  Navigation: undefined;
  Profile: undefined;
};

// Socket Event Types
export interface SocketBusLocation {
  busId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface SocketPickupCluster {
  clusters: PickupCluster[];
  timestamp: string;
  totalPickups: number;
}
