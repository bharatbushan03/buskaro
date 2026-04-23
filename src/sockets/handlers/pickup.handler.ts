/**
 * Pickup Socket Event Handlers
 * 
 * Real-time event handlers for dynamic pickup requests.
 * 
 * Events:
 * - student:pin-location - Student drops a pin
 * - student:cancel-pin - Student cancels their pin
 * - driver:pickup-complete - Driver marks pickup complete
 * - Server emits: pickup:new-request, pickup:confirmed, pickup:removed
 */

import { Server, Socket } from 'socket.io';
import { pickupService } from '../../modules/pickups/pickup.service';
import { pickupRepository } from '../../modules/pickups/pickup.repository';
import { ValidationError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { io } from '../index';

// Socket event constants
const PickupSocketEvents = {
  // Student events
  STUDENT_PIN_LOCATION: 'student:pin-location',
  STUDENT_CANCEL_PIN: 'student:cancel-pin',
  
  // Driver events
  DRIVER_PICKUP_COMPLETE: 'driver:pickup-complete',
  
  // Server broadcast events
  PICKUP_NEW_REQUEST: 'pickup:new-request',
  PICKUP_CONFIRMED: 'pickup:confirmed',
  PICKUP_COMPLETED: 'pickup:completed',
  PICKUP_EXPIRED: 'pickup:expired',
  PICKUP_REMOVED: 'pickup:removed',
  PICKUP_ERROR: 'pickup:error',
} as const;

/**
 * Validate GPS coordinates
 */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Register pickup socket event handlers
 */
export const registerPickupHandlers = (io: Server, socket: Socket): void => {
  const userId = socket.user?.id;
  const userRole = socket.user?.role;

  // ==================== STUDENT EVENTS ====================

  /**
   * student:pin-location
   * Student drops a pickup pin via socket (alternative to REST API)
   */
  socket.on(PickupSocketEvents.STUDENT_PIN_LOCATION, async (data, callback) => {
    try {
      if (userRole !== 'STUDENT') {
        throw new ValidationError('Only students can create pickup pins');
      }

      const studentId = socket.user?.studentId;
      if (!studentId) {
        throw new ValidationError('Student ID not found');
      }

      const { latitude, longitude, address, accuracy, notes } = data;

      // Validate coordinates
      if (!isValidCoordinate(latitude, longitude)) {
        throw new ValidationError('Invalid GPS coordinates');
      }

      const pickup = await pickupService.createPin({
        studentId,
        latitude,
        longitude,
        address,
        accuracy,
        notes,
      });

      // Acknowledge success to student
      if (callback) {
        callback({
          success: true,
          data: pickup,
        });
      }

      logger.info(`Socket: Student ${studentId} created pickup pin: ${pickup.id}`);
    } catch (error) {
      logger.error('Socket: Error creating pickup pin:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      socket.emit(PickupSocketEvents.PICKUP_ERROR, {
        type: 'create_error',
        message: error instanceof Error ? error.message : 'Failed to create pickup',
      });
    }
  });

  /**
   * student:cancel-pin
   * Student cancels their active pin via socket
   */
  socket.on(PickupSocketEvents.STUDENT_CANCEL_PIN, async (data, callback) => {
    try {
      if (userRole !== 'STUDENT') {
        throw new ValidationError('Only students can cancel pickup pins');
      }

      const studentId = socket.user?.studentId;
      if (!studentId) {
        throw new ValidationError('Student ID not found');
      }

      const { pickupId } = data;

      const cancelled = await pickupService.cancelPin(studentId, pickupId);

      if (callback) {
        callback({
          success: true,
          data: cancelled,
        });
      }

      logger.info(`Socket: Student ${studentId} cancelled pickup: ${pickupId}`);
    } catch (error) {
      logger.error('Socket: Error cancelling pickup:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // ==================== DRIVER EVENTS ====================

  /**
   * driver:pickup-complete
   * Driver marks a pickup as complete via socket
   */
  socket.on(PickupSocketEvents.DRIVER_PICKUP_COMPLETE, async (data, callback) => {
    try {
      if (userRole !== 'DRIVER') {
        throw new ValidationError('Only drivers can complete pickups');
      }

      const driverId = socket.user?.driverId;
      if (!driverId) {
        throw new ValidationError('Driver ID not found');
      }

      const { pickupId } = data;

      const completed = await pickupService.completePickup(pickupId, driverId);

      if (callback) {
        callback({
          success: true,
          data: completed,
        });
      }

      logger.info(`Socket: Driver ${driverId} completed pickup: ${pickupId}`);
    } catch (error) {
      logger.error('Socket: Error completing pickup:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // ==================== ROOM MANAGEMENT ====================

  /**
   * Student joins their personal room for notifications
   */
  if (userRole === 'STUDENT' && socket.user?.studentId) {
    const studentRoom = `student:${socket.user.studentId}`;
    socket.join(studentRoom);
    logger.debug(`Student ${socket.user.studentId} joined room ${studentRoom}`);
  }

  /**
   * Driver joins driver room
   */
  if (userRole === 'DRIVER' && socket.user?.driverId) {
    const driverRoom = `driver:${socket.user.driverId}`;
    socket.join(driverRoom);
    logger.debug(`Driver ${socket.user.driverId} joined room ${driverRoom}`);
  }
};

// ==================== SERVER BROADCAST HELPERS ====================

/**
 * Broadcast new pickup request to all drivers
 */
export const broadcastNewPickup = (pickup: any): void => {
  if (!io) return;

  io.emit(PickupSocketEvents.PICKUP_NEW_REQUEST, {
    id: pickup.id,
    studentId: pickup.studentId,
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    address: pickup.address,
    notes: pickup.notes,
    requestedAt: pickup.requestedAt,
    expiresAt: pickup.expiresAt,
  });

  logger.debug(`Broadcasted new pickup: ${pickup.id}`);
};

/**
 * Notify student their pickup was accepted
 */
export const notifyPickupConfirmed = (pickup: any): void => {
  if (!io) return;

  const studentRoom = `student:${pickup.studentId}`;
  
  io.to(studentRoom).emit(PickupSocketEvents.PICKUP_CONFIRMED, {
    pickupId: pickup.id,
    driverId: pickup.driverId,
    busId: pickup.busId,
    status: pickup.status,
  });

  logger.debug(`Notified student ${pickup.studentId} of pickup confirmation`);
};

/**
 * Notify student their pickup was completed
 */
export const notifyPickupCompleted = (pickup: any): void => {
  if (!io) return;

  const studentRoom = `student:${pickup.studentId}`;
  
  io.to(studentRoom).emit(PickupSocketEvents.PICKUP_COMPLETED, {
    pickupId: pickup.id,
    completedAt: pickup.completedAt,
  });

  logger.debug(`Notified student ${pickup.studentId} of pickup completion`);
};

/**
 * Notify student their pickup expired
 */
export const notifyPickupExpired = (pickup: any): void => {
  if (!io) return;

  const studentRoom = `student:${pickup.studentId}`;
  
  io.to(studentRoom).emit(PickupSocketEvents.PICKUP_EXPIRED, {
    pickupId: pickup.id,
    expiredAt: new Date().toISOString(),
  });

  // Also broadcast to drivers to remove from their list
  io.emit(PickupSocketEvents.PICKUP_REMOVED, { pickupId: pickup.id });

  logger.debug(`Notified student ${pickup.studentId} of pickup expiration`);
};
