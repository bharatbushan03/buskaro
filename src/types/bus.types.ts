/**
 * Bus Domain Types
 * 
 * Type definitions for bus fleet management.
 */

export enum BusStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum BusType {
  STANDARD = 'STANDARD',
  AC = 'AC',
  LUXURY = 'LUXURY',
  MINI = 'MINI',
}

export interface Bus {
  id: string;
  registrationNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  type: BusType;
  capacity: number;
  status: BusStatus;
  currentDriverId: string | null;
  currentRouteId: string | null;
  gpsDeviceId: string | null;
  lastKnownLocation: GeoLocation | null;
  fuelType: string;
  insuranceExpiry: Date;
  permitExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

export interface BusLocationUpdate {
  busId: string;
  location: GeoLocation;
  driverId: string;
}

export interface BusAssignment {
  busId: string;
  driverId: string;
  routeId: string;
  assignedAt: Date;
  assignedBy: string;
}
