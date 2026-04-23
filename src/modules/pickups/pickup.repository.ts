/**
 * Pickup Repository
 * 
 * Database operations for dynamic pickup requests.
 * Supports geo-based queries for nearby pickups.
 */

import { PrismaClient, PickupRequest, PickupRequestStatus, Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Radius for nearby pickup search in kilometers
 */
const NEARBY_RADIUS_KM = 5;

export interface CreatePickupData {
  studentId: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  notes?: string;
  expiresAt: Date;
}

export interface NearbyPickupQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  driverId?: string;
  status?: PickupRequestStatus;
}

export class PickupRepository {
  /**
   * Create a new pickup request
   */
  async create(data: CreatePickupData): Promise<PickupRequest> {
    return prisma.pickupRequest.create({
      data: {
        studentId: data.studentId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        accuracy: data.accuracy,
        notes: data.notes,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            grade: true,
            section: true,
          },
        },
      },
    });
  }

  /**
   * Find pickup by ID
   */
  async findById(id: string): Promise<PickupRequest | null> {
    return prisma.pickupRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            grade: true,
            section: true,
            parentPhone: true,
          },
        },
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        bus: {
          select: {
            id: true,
            number: true,
            routeNumber: true,
          },
        },
      },
    });
  }

  /**
   * Find active pickup by student ID
   */
  async findActiveByStudent(studentId: string): Promise<PickupRequest | null> {
    return prisma.pickupRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if student has active pickup
   */
  async hasActivePickup(studentId: string): Promise<boolean> {
    const count = await prisma.pickupRequest.count({
      where: {
        studentId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { gt: new Date() },
      },
    });
    return count > 0;
  }

  /**
   * Find nearby pickup requests using geo query
   * Uses Haversine formula for distance calculation
   */
  async findNearby(query: NearbyPickupQuery): Promise<(PickupRequest & { distanceKm: number })[]> {
    const { latitude, longitude, radiusKm = NEARBY_RADIUS_KM, status = 'PENDING' } = query;

    // Raw SQL with Haversine formula for accurate distance calculation
    const results = await prisma.$queryRaw<Array<PickupRequest & { distanceKm: number }>>`
      SELECT 
        pr.*,
        (6371 * acos(
          cos(radians(${latitude})) * cos(radians(pr.latitude)) *
          cos(radians(pr.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(pr.latitude))
        )) AS "distanceKm"
      FROM pickup_requests pr
      WHERE pr.status = ${status}
        AND pr.expires_at > NOW()
        AND (6371 * acos(
          cos(radians(${latitude})) * cos(radians(pr.latitude)) *
          cos(radians(pr.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(pr.latitude))
        )) <= ${radiusKm}
      ORDER BY "distanceKm" ASC
      LIMIT 50
    `;

    return results;
  }

  /**
   * Find all pending pickups (for admin dashboard)
   */
  async findAllPending(): Promise<PickupRequest[]> {
    return prisma.pickupRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept a pickup request (assign driver)
   */
  async accept(id: string, driverId: string, busId: string): Promise<PickupRequest> {
    return prisma.pickupRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        driverId,
        busId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            parentPhone: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        bus: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });
  }

  /**
   * Complete a pickup request
   */
  async complete(id: string): Promise<PickupRequest> {
    return prisma.pickupRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancel a pickup request
   */
  async cancel(id: string, reason?: string): Promise<PickupRequest> {
    return prisma.pickupRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : undefined,
      },
    });
  }

  /**
   * Expire old pickup requests
   */
  async expireOldPickups(): Promise<{ count: number; ids: string[] }> {
    const expired = await prisma.pickupRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
    });

    if (expired.length === 0) {
      return { count: 0, ids: [] };
    }

    const ids = expired.map((e) => e.id);

    await prisma.pickupRequest.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info(`Expired ${ids.length} pickup requests`);

    return { count: ids.length, ids };
  }

  /**
   * Get pickup statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    completed: number;
    expired: number;
    cancelled: number;
  }> {
    const [total, pending, accepted, completed, expired, cancelled] = await Promise.all([
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({ where: { status: 'PENDING' } }),
      prisma.pickupRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.pickupRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.pickupRequest.count({ where: { status: 'EXPIRED' } }),
      prisma.pickupRequest.count({ where: { status: 'CANCELLED' } }),
    ]);

    return { total, pending, accepted, completed, expired, cancelled };
  }

  /**
   * Delete a pickup request
   */
  async delete(id: string): Promise<void> {
    await prisma.pickupRequest.delete({
      where: { id },
    });
  }
}

export const pickupRepository = new PickupRepository();

