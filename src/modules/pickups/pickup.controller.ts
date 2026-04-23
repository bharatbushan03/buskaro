/**
 * Pickup Controller
 * 
 * HTTP request handlers for dynamic pickup requests.
 * 
 * Endpoints:
 * - POST /api/students/pin-location (students)
 * - GET /api/students/my-pin (students)
 * - DELETE /api/students/cancel-pin/:id (students)
 * - GET /api/drivers/pickups (drivers)
 * - PATCH /api/drivers/pickup/:id/accept (drivers)
 * - PATCH /api/drivers/pickup/:id/complete (drivers)
 */

import { Request, Response, NextFunction } from 'express';
import { PickupService, pickupService } from './pickup.service';
import { logger } from '../../utils/logger';

export class PickupController {
  constructor(private service: PickupService) {}

  // ==================== STUDENT ENDPOINTS ====================

  /**
   * POST /api/students/pin-location
   * Create a new pickup pin (drop location on map)
   */
  createPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Student ID not found in token' },
        });
      }

      const { latitude, longitude, address, accuracy, notes } = req.body;

      const pickup = await this.service.createPin({
        studentId,
        latitude,
        longitude,
        address,
        accuracy,
        notes,
      });

      logger.info(`Student ${studentId} created pickup pin: ${pickup.id}`);

      res.status(201).json({
        success: true,
        data: {
          pickup,
          expiresAt: pickup.expiresAt,
          message: 'Pickup request created successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/students/my-pin
   * Get student's current active pickup pin
   */
  getMyPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Student ID not found in token' },
        });
      }

      const pickup = await this.service.getMyPin(studentId);

      if (!pickup) {
        return res.status(404).json({
          success: false,
          error: { message: 'No active pickup request found' },
        });
      }

      res.json({
        success: true,
        data: pickup,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/students/cancel-pin/:id
   * Cancel a pickup pin
   */
  cancelPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Student ID not found in token' },
        });
      }

      const { id } = req.params;

      const cancelled = await this.service.cancelPin(studentId, id);

      logger.info(`Student ${studentId} cancelled pickup: ${id}`);

      res.json({
        success: true,
        data: cancelled,
        message: 'Pickup request cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== DRIVER ENDPOINTS ====================

  /**
   * GET /api/drivers/pickups
   * Get nearby pending pickup requests
   */
  getNearbyPickups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.user?.driverId;
      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Driver ID not found in token' },
        });
      }

      const { latitude, longitude, radiusKm } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: { message: 'Latitude and longitude are required' },
        });
      }

      const pickups = await this.service.getNearbyPickups({
        driverId,
        busId: req.user?.busId || '',
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
      });

      res.json({
        success: true,
        data: pickups,
        count: pickups.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/drivers/pickup/:id/accept
   * Accept a pickup request
   */
  acceptPickup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.user?.driverId;
      const busId = req.user?.busId;
      
      if (!driverId || !busId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Driver ID or Bus ID not found in token' },
        });
      }

      const { id } = req.params;

      const pickup = await this.service.acceptPickup(id, driverId, busId);

      logger.info(`Driver ${driverId} accepted pickup: ${id}`);

      res.json({
        success: true,
        data: pickup,
        message: 'Pickup accepted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/drivers/pickup/:id/complete
   * Complete a pickup request
   */
  completePickup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.user?.driverId;
      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Driver ID not found in token' },
        });
      }

      const { id } = req.params;

      const pickup = await this.service.completePickup(id, driverId);

      logger.info(`Driver ${driverId} completed pickup: ${id}`);

      res.json({
        success: true,
        data: pickup,
        message: 'Pickup completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== ADMIN/STATS ENDPOINTS ====================

  /**
   * GET /api/pickups/stats
   * Get pickup statistics (admin only)
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const pickupController = new PickupController(pickupService);
