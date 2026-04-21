/**
 * Route Domain Types
 * 
 * Type definitions for bus routes and pickup points.
 */

export interface Route {
  id: string;
  name: string;
  routeNumber: string;
  description: string | null;
  startLocation: string;
  endLocation: string;
  totalDistance: number; // in kilometers
  estimatedDuration: number; // in minutes
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface PickupPoint {
  id: string;
  routeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  landmark: string | null;
  arrivalTime: string; // HH:mm format
  sequenceOrder: number;
  estimatedWaitMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PickupPin {
  id: string;
  pickupPointId: string;
  code: string;
  isActive: boolean;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface RouteWithPickupPoints extends Route {
  pickupPoints: PickupPoint[];
}

export interface RouteAnalytics {
  routeId: string;
  averagePassengers: number;
  averageDelay: number;
  onTimePerformance: number;
  popularPickupPoints: string[];
}
