/**
 * Attendance Domain Types
 * 
 * Type definitions for student attendance tracking.
 */

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export interface Attendance {
  id: string;
  studentId: string;
  busId: string;
  routeId: string;
  pickupPointId: string | null;
  date: Date;
  status: AttendanceStatus;
  boardingTime: Date | null;
  alightingTime: Date | null;
  verifiedByPin: boolean;
  verifiedByNfc: boolean;
  verifiedByQr: boolean;
  locationAtVerification: GeoLocation | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: Date;
}

export interface AttendanceSummary {
  studentId: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface VerificationRequest {
  studentId: string;
  method: 'PIN' | 'NFC' | 'QR';
  code?: string;
  location?: GeoLocation;
}
