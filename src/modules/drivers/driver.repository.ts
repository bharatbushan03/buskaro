/**
 * Driver Repository
 * 
 * Database operations for driver operations including:
 * - Driver profile and assignments
 * - Trip state management
 * - Route data retrieval
 * - Pickup request queries
 */

import { PrismaClient, BusStatus, PickupRequestStatus, TripStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface DriverAssignment {
  driverId: string;
  busId: string | null;
  routeId: string | null;
}

export interface TripData {
  busId: string;
  driverId: string;
  routeId: string;
  startTime: Date;
  status: TripStatus;
}

export class DriverRepository {
  /**
   * Get driver with assigned bus and route
   */
  async getDriverWithAssignment(driverId: string): Promise<any> {
    return prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        bus: {
          include: {
            route: {
              include: {
                pickupPoints: {
                  orderBy: { sequenceOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get active trip for driver
   */
  async getActiveTrip(driverId: string) {
    return prisma.trip.findFirst({
      where: {
        driverId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
      include: {
        bus: true,
        route: {
          include: {
            pickupPoints: {
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Get active pickups for driver's route
   */
  async getActivePickupsForRoute(routeId: string) {
    return prisma.pickupRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { gt: new Date() },
        student: {
          routeId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            department: true,
            semester: true,
            parentPhone: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { requestedAt: 'asc' },
      ],
    });
  }

  /**
   * Get nearby pickups with distance calculation
   */
  async getNearbyPickups(
    routeId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ) {
    return prisma.$queryRaw<Array<any>>`
      SELECT 
        pr.*,
        s.name as student_name,
        s.roll_number,
        s.department,
        s.semester,
        s.parent_phone,
        (6371 * acos(
          cos(radians(${latitude})) * cos(radians(pr.latitude)) *
          cos(radians(pr.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(pr.latitude))
        )) AS "distanceKm"
      FROM pickup_requests pr
      JOIN students s ON pr.student_id = s.id
      WHERE pr.status IN ('PENDING', 'ACCEPTED')
        AND pr.expires_at > NOW()
        AND s.route_id = ${routeId}
        AND (6371 * acos(
          cos(radians(${latitude})) * cos(radians(pr.latitude)) *
          cos(radians(pr.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(pr.latitude))
        )) <= ${radiusKm}
      ORDER BY "distanceKm" ASC
      LIMIT 20
    `;
  }

  /**
   * Create a new trip
   */
  async createTrip(data: TripData) {
    return prisma.trip.create({
      data: {
        busId: data.busId,
        driverId: data.driverId,
        routeId: data.routeId,
        startTime: data.startTime,
        status: data.status,
      },
      include: {
        bus: true,
        route: {
          include: {
            pickupPoints: {
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * End a trip
   */
  async endTrip(tripId: string, endTime: Date) {
    return prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        endTime,
      },
      include: {
        bus: true,
        route: true,
      },
    });
  }

  /**
   * Update bus status
   */
  async updateBusStatus(busId: string, status: BusStatus) {
    return prisma.bus.update({
      where: { id: busId },
      data: { status },
    });
  }

  /**
   * Get full route with GeoJSON path
   */
  async getRouteWithPath(routeId: string) {
    return prisma.route.findUnique({
      where: { id: routeId },
      include: {
        pickupPoints: {
          orderBy: { sequenceOrder: 'asc' },
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            landmark: true,
            arrivalTime: true,
            sequenceOrder: true,
          },
        },
        buses: {
          where: { status: { not: 'MAINTENANCE' } },
          select: {
            id: true,
            registrationNumber: true,
            status: true,
            currentLat: true,
            currentLng: true,
          },
        },
      },
    });
  }

  /**
   * Get pickup request by ID with student details
   */
  async getPickupWithStudent(pickupId: string) {
    return prisma.pickupRequest.findUnique({
      where: { id: pickupId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            department: true,
            semester: true,
            parentPhone: true,
            busId: true,
            routeId: true,
          },
        },
      },
    });
  }

  /**
   * Get driver statistics
   */
  async getDriverStats(driverId: string) {
    const [totalTrips, completedPickups, activePickups] = await Promise.all([
      prisma.trip.count({
        where: { driverId },
      }),
      prisma.pickupRequest.count({
        where: {
          driverId,
          status: 'COMPLETED',
        },
      }),
      prisma.pickupRequest.count({
        where: {
          driverId,
          status: 'ACCEPTED',
        },
      }),
    ]);

    return {
      totalTrips,
      completedPickups,
      activePickups,
    };
  }

  /**
   * Check if driver has active trip
   */
  async hasActiveTrip(driverId: string): Promise<boolean> {
    const count = await prisma.trip.count({
      where: {
        driverId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
    });
    return count > 0;
  }

  /**
   * Get trip by ID
   */
  async getTripById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        driver: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
        route: {
          include: {
            pickupPoints: {
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    });
  }
}

export const driverRepository = new DriverRepository();
