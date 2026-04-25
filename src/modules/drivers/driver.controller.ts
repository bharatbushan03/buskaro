/**
 * Driver Controller
 * 
 * HTTP request handlers for driver endpoints:
 * - GET /api/drivers/dashboard
 * - POST /api/drivers/start-trip
 * - POST /api/drivers/end-trip
 * - GET /api/drivers/route
 */

import { Request, Response, NextFunction } from 'express';
import { driverService } from './driver.service';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';

export class DriverController {
  /**
   * GET /api/drivers/dashboard
   * Get comprehensive dashboard data for authenticated driver
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      const dashboard = await driverService.getDashboard(driverId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/drivers/start-trip
   * Start a new trip for the driver
   */
  async startTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      const result = await driverService.startTrip(driverId);

      res.status(200).json({
        success: true,
        message: 'Trip started successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/drivers/end-trip
   * End the current active trip
   */
  async endTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      const result = await driverService.endTrip(driverId);

      res.status(200).json({
        success: true,
        message: 'Trip ended successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/drivers/route
   * Get navigation-ready route data
   */
  async getRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      const routeData = await driverService.getRouteNavigation(driverId);

      res.status(200).json({
        success: true,
        data: routeData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/drivers/pickups/nearby
   * Get nearby pickups sorted by distance
   */
  async getNearbyPickups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      // Get dashboard which includes sorted pickups
      const dashboard = await driverService.getDashboard(driverId);

      res.status(200).json({
        success: true,
        data: {
          pickups: dashboard.pickups,
          count: dashboard.pickups.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/drivers/pickups/:id/accept
   * Accept a pickup request
   */
  async acceptPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      const { id } = req.params;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      // This will be handled by pickup service
      // Import and use pickupService.acceptPickup
      const { pickupService } = await import('../pickups/pickup.service');
      const result = await pickupService.acceptPickup(id, driverId);

      res.status(200).json({
        success: true,
        message: 'Pickup accepted',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/drivers/pickups/:id/complete
   * Complete a pickup request
   */
  async completePickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      const { id } = req.params;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      // This will be handled by pickup service
      const { pickupService } = await import('../pickups/pickup.service');
      const result = await pickupService.completePickup(id, driverId);

      res.status(200).json({
        success: true,
        message: 'Pickup completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/drivers/trip/status
   * Get current trip status
   */
  async getTripStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.user?.driverId;
      
      if (!driverId) {
        throw new AppError('Driver ID not found in token', 401);
      }

      const { driverRepository } = await import('./driver.repository');
      const activeTrip = await driverRepository.getActiveTrip(driverId);

      res.status(200).json({
        success: true,
        data: {
          hasActiveTrip: !!activeTrip,
          trip: activeTrip ? {
            id: activeTrip.id,
            status: activeTrip.status,
            startTime: activeTrip.startTime,
            route: activeTrip.route ? {
              id: activeTrip.route.id,
              name: activeTrip.route.name,
            } : null,
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const driverController = new DriverController();
