/**
 * Pickup Service
 * 
 * Business logic for dynamic pickup requests.
 * Handles student pin creation, driver assignment, and real-time updates.
 * 
 * Features:
 * - One active pin per student enforcement
 * - Geo-validation for coordinates
 * - Rate limiting for pin creation
 * - Socket.IO notifications
 * - Auto-expiry handling
 */

import { PickupRequest, PickupRequestStatus } from '@prisma/client';
import { PickupRepository, pickupRepository, CreatePickupData } from './pickup.repository';
import { ValidationError, NotFoundError, ConflictError } from '../../middleware/error.middleware';
import { redis, RedisKeys, RedisTTL } from '../../config/redis.config';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';
import { getBusRoom, getDriverRoom } from '../../sockets/events';

// Constants
const PICKUP_EXPIRY_MINUTES = 30;
const PIN_RATE_LIMIT_KEY = 'pickup:rate:';
const MAX_PINS_PER_HOUR = 5;
const NEARBY_RADIUS_KM = 5;

// Coordinate validation
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

export interface CreatePinInput {
  studentId: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  notes?: string;
}

export interface NearbyQuery {
  driverId: string;
  busId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export class PickupService {
  constructor(private repository: PickupRepository) {}

  /**
   * Create a pickup pin (student)
   * Rules:
   * - Only one active pin per student
   * - Rate limited (5 per hour)
   * - Valid GPS coordinates required
   */
  async createPin(input: CreatePinInput): Promise<PickupRequest> {
    // Validate coordinates
    if (!isValidCoordinate(input.latitude, input.longitude)) {
      throw new ValidationError('Invalid GPS coordinates');
    }

    // Check for existing active pin
    const hasActive = await this.repository.hasActivePickup(input.studentId);
    if (hasActive) {
      throw new ConflictError('You already have an active pickup request. Cancel it first.');
    }

    // Rate limiting - check if student has exceeded pin creation limit
    const rateKey = `${PIN_RATE_LIMIT_KEY}${input.studentId}`;
    const currentCount = await redis.get(rateKey);
    if (currentCount && parseInt(currentCount, 10) >= MAX_PINS_PER_HOUR) {
      throw new ValidationError(
        `Rate limit exceeded: Maximum ${MAX_PINS_PER_HOUR} pickup requests per hour`
      );
    }

    // Calculate expiry time (30 minutes from now)
    const expiresAt = new Date(Date.now() + PICKUP_EXPIRY_MINUTES * 60 * 1000);

    // Create the pickup request
    const pickup = await this.repository.create({
      ...input,
      expiresAt,
    });

    // Increment rate limit counter
    await redis.incr(rateKey);
    await redis.expire(rateKey, 3600); // 1 hour window

    // Notify nearby drivers via Socket.IO
    this.notifyDriversOfNewPickup(pickup);

    logger.info(`Pickup pin created: ${pickup.id} by student ${input.studentId}`);

    return pickup;
  }

  /**
   * Get student's active pin
   */
  async getMyPin(studentId: string): Promise<PickupRequest | null> {
    return this.repository.findActiveByStudent(studentId);
  }

  /**
   * Cancel student's active pin
   */
  async cancelPin(studentId: string, pickupId: string): Promise<PickupRequest> {
    const pickup = await this.repository.findById(pickupId);
    
    if (!pickup) {
      throw new NotFoundError('Pickup request not found');
    }

    if (pickup.studentId !== studentId) {
      throw new ValidationError('You can only cancel your own pickup requests');
    }

    if (pickup.status !== 'PENDING' && pickup.status !== 'ACCEPTED') {
      throw new ValidationError(`Cannot cancel a pickup with status: ${pickup.status}`);
    }

    const cancelled = await this.repository.cancel(pickupId, 'Cancelled by student');

    // Notify drivers that pin was removed
    this.notifyDriversOfRemovedPickup(pickupId);

    logger.info(`Pickup pin cancelled: ${pickupId} by student ${studentId}`);

    return cancelled;
  }

  /**
   * Get nearby pending pickups for driver
   */
  async getNearbyPickups(query: NearbyQuery): Promise<(PickupRequest & { distanceKm: number })[]> {
    return this.repository.findNearby({
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radiusKm || NEARBY_RADIUS_KM,
      status: 'PENDING',
    });
  }

  /**
   * Accept a pickup request (driver)
   */
  async acceptPickup(
    pickupId: string,
    driverId: string,
    busId: string
  ): Promise<PickupRequest> {
    const pickup = await this.repository.findById(pickupId);
    
    if (!pickup) {
      throw new NotFoundError('Pickup request not found');
    }

    if (pickup.status !== 'PENDING') {
      throw new ConflictError(`Cannot accept pickup with status: ${pickup.status}`);
    }

    const accepted = await this.repository.accept(pickupId, driverId, busId);

    // Notify student that pickup was accepted
    this.notifyStudentOfAcceptedPickup(accepted);

    logger.info(`Pickup ${pickupId} accepted by driver ${driverId}`);

    return accepted;
  }

  /**
   * Complete a pickup (driver)
   */
  async completePickup(pickupId: string, driverId: string): Promise<PickupRequest> {
    const pickup = await this.repository.findById(pickupId);
    
    if (!pickup) {
      throw new NotFoundError('Pickup request not found');
    }

    if (pickup.driverId !== driverId) {
      throw new ValidationError('You can only complete your assigned pickups');
    }

    if (pickup.status !== 'ACCEPTED') {
      throw new ValidationError(`Cannot complete pickup with status: ${pickup.status}`);
    }

    const completed = await this.repository.complete(pickupId);

    // Notify student that pickup was completed
    this.notifyStudentOfCompletedPickup(completed);

    logger.info(`Pickup ${pickupId} completed by driver ${driverId}`);

    return completed;
  }

  /**
   * Expire old pickup requests (background job)
   */
  async expireOldPickups(): Promise<{ count: number; ids: string[] }> {
    const result = await this.repository.expireOldPickups();

    if (result.count > 0) {
      // Notify affected students
      for (const id of result.ids) {
        const pickup = await this.repository.findById(id);
        if (pickup) {
          this.notifyStudentOfExpiredPickup(pickup);
        }
      }

      logger.info(`Auto-expired ${result.count} pickup requests`);
    }

    return result;
  }

  /**
   * Get pickup statistics
   */
  async getStats() {
    return this.repository.getStats();
  }

  // ==================== SOCKET.IO NOTIFICATIONS ====================

  /**
   * Notify nearby drivers of new pickup
   */
  private notifyDriversOfNewPickup(pickup: PickupRequest): void {
    if (!io) return;

    // Broadcast to all drivers (they filter by proximity client-side)
    io.emit('pickup:new-request', {
      id: pickup.id,
      studentId: pickup.studentId,
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      address: pickup.address,
      notes: pickup.notes,
      requestedAt: pickup.requestedAt,
      expiresAt: pickup.expiresAt,
    });

    logger.debug(`Notified drivers of new pickup: ${pickup.id}`);
  }

  /**
   * Notify drivers that a pickup was removed
   */
  private notifyDriversOfRemovedPickup(pickupId: string): void {
    if (!io) return;

    io.emit('pickup:removed', { pickupId });
  }

  /**
   * Notify student that pickup was accepted
   */
  private notifyStudentOfAcceptedPickup(pickup: PickupRequest): void {
    if (!io) return;

    // Emit to student's room
    io.to(`student:${pickup.studentId}`).emit('pickup:confirmed', {
      pickupId: pickup.id,
      driverId: pickup.driverId,
      busId: pickup.busId,
      status: pickup.status,
    });
  }

  /**
   * Notify student that pickup was completed
   */
  private notifyStudentOfCompletedPickup(pickup: PickupRequest): void {
    if (!io) return;

    io.to(`student:${pickup.studentId}`).emit('pickup:completed', {
      pickupId: pickup.id,
      completedAt: pickup.completedAt,
    });
  }

  /**
   * Notify student that pickup expired
   */
  private notifyStudentOfExpiredPickup(pickup: PickupRequest): void {
    if (!io) return;

    io.to(`student:${pickup.studentId}`).emit('pickup:expired', {
      pickupId: pickup.id,
      expiredAt: new Date().toISOString(),
    });

    // Also notify drivers to remove from their list
    io.emit('pickup:removed', { pickupId: pickup.id });
  }
}

export const pickupService = new PickupService(pickupRepository);
