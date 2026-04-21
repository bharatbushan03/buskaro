/**
 * User Domain Types
 * 
 * Type definitions for user-related entities.
 * These mirror the database schema for type safety.
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// Base User entity
export interface User {
  id: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// Student entity (extends User)
export interface Student {
  id: string;
  userId: string;
  studentId: string; // College student ID
  name: string;
  department: string;
  semester: number;
  rollNumber: string;
  busId: string | null;
  routeId: string | null;
  pickupPinId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

// Driver entity (extends User)
export interface Driver {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: Date;
  emergencyContact: string | null;
  currentBusId: string | null;
  isOnDuty: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Admin entity (extends User)
export interface Admin {
  id: string;
  userId: string;
  name: string;
  department: string | null;
  permissions: AdminPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_BUSES = 'MANAGE_BUSES',
  MANAGE_ROUTES = 'MANAGE_ROUTES',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
}

// Auth-related types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  // Role-specific data
  studentData?: Omit<Student, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  driverData?: Omit<Driver, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  adminData?: Omit<Admin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
}

// Profile update types
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  department?: string;
}

// User with relations (for API responses)
export interface UserWithProfile extends User {
  student?: Student;
  driver?: Driver;
  admin?: Admin;
}
