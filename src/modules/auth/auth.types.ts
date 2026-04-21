/**
 * Auth Module-specific Types
 * 
 * Additional types specific to authentication functionality.
 */

import { AuthTokens } from '../../types/user.types';

// Request/Response DTOs
export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
  role: 'STUDENT' | 'DRIVER' | 'ADMIN';
  // Role-specific fields
  name: string;
  department?: string;
  studentId?: string;
  semester?: number;
  rollNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export interface RegisterResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Token payload for internal use
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Password reset flow
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

// Email verification
export interface EmailVerificationRequest {
  token: string;
}

// OTP verification
export interface OtpVerificationRequest {
  phone: string;
  otp: string;
}

// Auth state
export interface AuthState {
  userId: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
  tokens: AuthTokens;
}
