/**
 * Driver Service
 * 
 * Business logic for driver operations:
 * - Dashboard data aggregation
 * - Trip lifecycle management
 * - Pickup sorting and filtering
 * - Socket event emission
 */

import { BusStatus, TripStatus, PickupRequestStatus } from '@prisma/client';
import { driverRepository } from './driver.repository';
import { io } from '../../sockets';
import { SocketEvents } from '../../sockets/events';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { calculateDistance } from '../../utils/geo.utils';

export interface DashboardData {
  driver: {
    id: string;
    name: string;
    licenseNumber: string;
    isOnDuty: boolean;
  };
  bus: {
    id: string;
    registrationNumber: string;
    model: string;
    capacity: number;
    status: BusStatus;
    currentLocation?: {
      lat: number;
      lng: number;
      lastUpdated: Date;
    };
  } | null;
  route: {
    id: string;
    name: string;
    routeNumber: string;
    totalDistance: number;
    estimatedDuration: number;
    stops: Array<{
      id: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      sequenceOrder: number;
      arrivalTime: string;
    }>;
  } | null;
  activeTrip: {
    id: string;
    status: TripStatus;
    startTime: Date;
    distanceKm?: number;
  } | null;
  pickups: Array<{
    id: string;
    studentName: string;
    rollNumber: string;
    grade: string;
    section: string;
    parentPhone?: string;
    lat: number;
    lng: number;
    distanceKm: number;
    status: PickupRequestStatus;
    requestedAt: Date;
    expiresAt: Date;
    notes?: string;
  }>;
  stats: {
    totalTrips: number;
    completedPickups: number;
    activePickups: number;
  };
}

export interface RouteNavigationData {
  route: {
    id: string;
    name: string;
    routeNumber: string;
    totalDistance: number;
    estimatedDuration: number;
  };
  path: {
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: number[][];
    };
    properties: Record<string, any>;
  } | null;
  stops: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    sequenceOrder: number;
    arrivalTime: string;
    landmark?: string;
    type: 'scheduled';
  }>;
  dynamicPickups: Array<{
    id: string;
    studentName: string;
    lat: number;
    lng: number;
    address?: string;
    status: PickupRequestStatus;
    type: 'dynamic';
  }>;
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    type: 'stop' | 'pickup';
  }>;
}

export class DriverService {
  /**
   * Get comprehensive dashboard data for driver
   */
  async getDashboard(driverId: string): Promise<DashboardData> {
    const driverData = await driverRepository.getDriverWithAssignment(driverId);
    
    if (!driverData) {
      throw new AppError('Driver not found', 404);
    }

    const [activeTrip, stats] = await Promise.all([
      driverRepository.getActiveTrip(driverId),
      driverRepository.getDriverStats(driverId),
    ]);

    // Get pickups sorted by distance if bus has location
    let pickups: DashboardData['pickups'] = [];
    if (driverData.bus?.routeId) {
      const busLat = driverData.bus.currentLat;
      const busLng = driverData.bus.currentLng;
      
      if (busLat && busLng) {
        // Get pickups sorted by distance from bus location
        const nearbyPickups = await driverRepository.getNearbyPickups(
          driverData.bus.routeId,
          busLat,
          busLng,
          10 // 10km radius
        );
        
        pickups = nearbyPickups.map((p: any) => ({
          id: p.id,
          studentName: p.student_name,
          rollNumber: p.roll_number,
          grade: p.grade,
          section: p.section,
          parentPhone: p.parent_phone,
          lat: p.latitude,
          lng: p.longitude,
          distanceKm: parseFloat(p.distanceKm),
          status: p.status,
          requestedAt: p.requested_at,
          expiresAt: p.expires_at,
          notes: p.notes,
        }));
      } else {
        // Fallback: get all active pickups for route
        const routePickups = await driverRepository.getActivePickupsForRoute(
          driverData.bus.routeId
        );
        
        pickups = routePickups.map(p => ({
          id: p.id,
          studentName: p.student.name,
          rollNumber: p.student.rollNumber,
          grade: p.student.grade,
          section: p.student.section,
          parentPhone: p.student.parentPhone,
          lat: p.latitude,
          lng: p.longitude,
          distanceKm: 0, // Unknown without bus location
          status: p.status,
          requestedAt: p.requestedAt,
          expiresAt: p.expiresAt,
          notes: p.notes,
        }));
      }
    }

    return {
      driver: {
        id: driverData.id,
        name: driverData.name,
        licenseNumber: driverData.licenseNumber,
        isOnDuty: driverData.isOnDuty,
      },
      bus: driverData.bus ? {
        id: driverData.bus.id,
        registrationNumber: driverData.bus.registrationNumber,
        model: driverData.bus.model,
        capacity: driverData.bus.capacity,
        status: driverData.bus.status,
        currentLocation: driverData.bus.currentLat && driverData.bus.currentLng ? {
          lat: driverData.bus.currentLat,
          lng: driverData.bus.currentLng,
          lastUpdated: driverData.bus.lastLocationAt || new Date(),
        } : undefined,
      } : null,
      route: driverData.bus?.route ? {
        id: driverData.bus.route.id,
        name: driverData.bus.route.name,
        routeNumber: driverData.bus.route.routeNumber,
        totalDistance: driverData.bus.route.totalDistance,
        estimatedDuration: driverData.bus.route.estimatedDuration,
        stops: driverData.bus.route.pickupPoints.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          lat: p.latitude,
          lng: p.longitude,
          sequenceOrder: p.sequenceOrder,
          arrivalTime: p.arrivalTime,
        })),
      } : null,
      activeTrip: activeTrip ? {
        id: activeTrip.id,
        status: activeTrip.status,
        startTime: activeTrip.startTime,
        distanceKm: activeTrip.distanceKm || undefined,
      } : null,
      pickups,
      stats,
    };
  }

  /**
   * Start a new trip
   */
  async startTrip(driverId: string): Promise<{ tripId: string; startTime: Date }> {
    // Check if driver already has active trip
    const hasActive = await driverRepository.hasActiveTrip(driverId);
    if (hasActive) {
      throw new AppError('Trip already in progress. End current trip first.', 400);
    }

    // Get driver with assignment
    const driverData = await driverRepository.getDriverWithAssignment(driverId);
    if (!driverData) {
      throw new AppError('Driver not found', 404);
    }

    if (!driverData.bus) {
      throw new AppError('No bus assigned. Contact admin.', 400);
    }

    if (!driverData.bus.routeId) {
      throw new AppError('No route assigned to bus. Contact admin.', 400);
    }

    if (driverData.bus.status === 'MAINTENANCE') {
      throw new AppError('Bus is under maintenance', 400);
    }

    // Create trip
    const startTime = new Date();
    const trip = await driverRepository.createTrip({
      busId: driverData.bus.id,
      driverId,
      routeId: driverData.bus.routeId,
      startTime,
      status: TripStatus.IN_PROGRESS,
    });

    // Update bus status
    await driverRepository.updateBusStatus(driverData.bus.id, BusStatus.IN_SERVICE);

    // Emit socket event
    io.to(`route:${driverData.bus.routeId}`)
      .to(`bus:${driverData.bus.id}`)
      .emit(SocketEvents.Driver.TRIP_STARTED, {
        tripId: trip.id,
        driverId,
        busId: driverData.bus.id,
        routeId: driverData.bus.routeId,
        startTime,
      });

    logger.info(`Trip started: ${trip.id} by driver ${driverId}`);

    return { tripId: trip.id, startTime };
  }

  /**
   * End current trip
   */
  async endTrip(driverId: string): Promise<{ tripId: string; endTime: Date; duration: number }> {
    const activeTrip = await driverRepository.getActiveTrip(driverId);
    
    if (!activeTrip) {
      throw new AppError('No active trip to end', 400);
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTrip.startTime.getTime()) / 1000 / 60); // minutes

    // End trip
    const trip = await driverRepository.endTrip(activeTrip.id, endTime);

    // Update bus status to IDLE
    await driverRepository.updateBusStatus(activeTrip.busId, BusStatus.IDLE);

    // Emit socket event
    io.to(`route:${activeTrip.routeId}`)
      .to(`bus:${activeTrip.busId}`)
      .emit(SocketEvents.Driver.TRIP_ENDED, {
        tripId: trip.id,
        driverId,
        busId: activeTrip.busId,
        routeId: activeTrip.routeId,
        endTime,
        duration,
      });

    logger.info(`Trip ended: ${trip.id} by driver ${driverId}, duration: ${duration}min`);

    return { tripId: trip.id, endTime, duration };
  }

  /**
   * Get navigation-ready route data
   */
  async getRouteNavigation(driverId: string): Promise<RouteNavigationData> {
    const driverData = await driverRepository.getDriverWithAssignment(driverId);
    
    if (!driverData?.bus?.route) {
      throw new AppError('No route assigned', 404);
    }

    const route = driverData.bus.route;

    // Get active pickups for this route
    const pickups = await driverRepository.getActivePickupsForRoute(route.id);

    // Build GeoJSON path from stored data
    let pathGeoJson: RouteNavigationData['path'] = null;
    if (route.pathGeoJson) {
      const pathData = route.pathGeoJson as any;
      pathGeoJson = {
        type: 'Feature',
        geometry: pathData.geometry || pathData,
        properties: {},
      };
    }

    // Combine stops and pickups into waypoints
    const waypoints: RouteNavigationData['waypoints'] = [
      ...route.pickupPoints.map(p => ({
        lat: p.latitude,
        lng: p.longitude,
        name: p.name,
        type: 'stop' as const,
      })),
      ...pickups.map(p => ({
        lat: p.latitude,
        lng: p.longitude,
        name: p.student.name,
        type: 'pickup' as const,
      })),
    ];

    return {
      route: {
        id: route.id,
        name: route.name,
        routeNumber: route.routeNumber,
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
      },
      path: pathGeoJson,
      stops: route.pickupPoints.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.latitude,
        lng: p.longitude,
        sequenceOrder: p.sequenceOrder,
        arrivalTime: p.arrivalTime,
        landmark: p.landmark || undefined,
        type: 'scheduled',
      })),
      dynamicPickups: pickups.map(p => ({
        id: p.id,
        studentName: p.student.name,
        lat: p.latitude,
        lng: p.longitude,
        address: p.address || undefined,
        status: p.status,
        type: 'dynamic',
      })),
      waypoints,
    };
  }

  /**
   * Sort pickups by distance from a reference point
   */
  sortPickupsByDistance(
    pickups: DashboardData['pickups'],
    lat: number,
    lng: number
  ): DashboardData['pickups'] {
    return [...pickups].sort((a, b) => {
      const distA = calculateDistance(lat, lng, a.lat, a.lng);
      const distB = calculateDistance(lat, lng, b.lat, b.lng);
      return distA - distB;
    });
  }

  /**
   * Sort pickups by expiry time (urgent first)
   */
  sortPickupsByUrgency(
    pickups: DashboardData['pickups']
  ): DashboardData['pickups'] {
    return [...pickups].sort((a, b) => {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });
  }

  /**
   * Check if driver can accept more pickups
   */
  async canAcceptPickups(driverId: string): Promise<boolean> {
    const hasActive = await driverRepository.hasActiveTrip(driverId);
    if (!hasActive) return false;

    const stats = await driverRepository.getDriverStats(driverId);
    return stats.activePickups < 10; // Max 10 concurrent pickups
  }
}

export const driverService = new DriverService();
