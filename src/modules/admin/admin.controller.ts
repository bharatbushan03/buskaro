/**
 * Admin Controller
 * 
 * HTTP request handlers for admin endpoints:
 * - User management (students, drivers)
 * - Bus & route management
 * - Real-time monitoring
 * - Analytics
 * - System control
 */

import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { SocketRooms } from '../../sockets/events';

export class AdminController {
  // ==================== USER MANAGEMENT ====================

  /**
   * GET /api/admin/students
   * Get students list with filters
   */
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId, routeId, search, page, limit } = req.query;

      const result = await adminService.getStudents({
        busId: busId as string,
        routeId: routeId as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/students/:id
   * Get student details
   */
  async getStudentDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const student = await adminService.getStudentDetails(id);

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/drivers
   * Get drivers list with filters
   */
  async getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isOnDuty, search, page, limit } = req.query;

      const result = await adminService.getDrivers({
        isOnDuty: isOnDuty ? isOnDuty === 'true' : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/drivers/:id
   * Get driver details
   */
  async getDriverDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const driver = await adminService.getDriverDetails(id);

      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/create-driver
   * Create a new driver (placeholder - requires auth service integration)
   */
  async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Full implementation requires user registration flow
      // This is a placeholder for the admin to trigger driver creation
      res.status(501).json({
        success: false,
        message: 'Driver creation requires user registration flow. Use /api/auth/register with role DRIVER.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/assign-bus
   * Assign bus to driver
   */
  async assignBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId, busId } = req.body;
      const adminId = req.user!.id;

      if (!driverId) {
        throw new AppError('Driver ID is required', 400);
      }

      const result = await adminService.assignBusToDriver(driverId, busId || null, adminId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/assign-student
   * Assign bus/route to student
   */
  async assignStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, busId, routeId, pickupPointId } = req.body;
      const adminId = req.user!.id;

      if (!studentId) {
        throw new AppError('Student ID is required', 400);
      }

      const result = await adminService.assignStudentBusRoute(
        studentId,
        busId || null,
        routeId || null,
        pickupPointId || null,
        adminId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.student,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUS & ROUTE MANAGEMENT ====================

  /**
   * GET /api/admin/buses
   * Get all buses
   */
  async getBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, routeId, page, limit } = req.query;

      const result = await adminService.getBuses({
        status: status as any,
        routeId: routeId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/buses/:id
   * Get bus details
   */
  async getBusDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bus = await adminService.getBusDetails(id);

      res.status(200).json({
        success: true,
        data: bus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/buses
   * Create a new bus
   */
  async createBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationNumber, model, manufacturer, year, capacity, fuelType } = req.body;
      const adminId = req.user!.id;

      if (!registrationNumber || !model || !manufacturer || !year || !capacity) {
        throw new AppError('Missing required fields', 400);
      }

      const bus = await adminService.createBus(
        { registrationNumber, model, manufacturer, year, capacity, fuelType },
        adminId
      );

      res.status(201).json({
        success: true,
        message: 'Bus created successfully',
        data: bus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/buses/:id
   * Update bus
   */
  async updateBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, currentDriverId, currentRouteId, model, capacity } = req.body;
      const adminId = req.user!.id;

      const bus = await adminService.updateBus(
        id,
        { status, currentDriverId, currentRouteId, model, capacity },
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Bus updated successfully',
        data: bus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/routes
   * Get all routes
   */
  async getRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await adminService.getRoutes({
        status: status as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/routes/:id
   * Get route details
   */
  async getRouteDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const route = await adminService.getRouteDetails(id);

      res.status(200).json({
        success: true,
        data: route,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/routes
   * Create a new route
   */
  async createRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, routeNumber, description, startLocation, endLocation, totalDistance, estimatedDuration } = req.body;
      const adminId = req.user!.id;

      if (!name || !routeNumber || !startLocation || !endLocation) {
        throw new AppError('Missing required fields', 400);
      }

      const route = await adminService.createRoute(
        { name, routeNumber, description, startLocation, endLocation, totalDistance, estimatedDuration },
        adminId
      );

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: route,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/routes/:id
   * Update route
   */
  async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, name, totalDistance, estimatedDuration } = req.body;
      const adminId = req.user!.id;

      const route = await adminService.updateRoute(
        id,
        { status, name, totalDistance, estimatedDuration },
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Route updated successfully',
        data: route,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== REAL-TIME MONITORING ====================

  /**
   * GET /api/admin/live-buses
   * Get real-time bus monitoring
   */
  async getLiveBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getLiveBuses();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/active-trips
   * Get active trips
   */
  async getActiveTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getActiveTrips();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/join-monitoring
   * Get socket room info for real-time monitoring
   */
  async joinMonitoring(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Socket room info for admin monitoring',
        data: {
          socketRoom: SocketRooms.ADMIN_GLOBAL,
          events: [
            'bus:location-update',
            'trip:started',
            'trip:ended',
            'pickup:new-request',
            'pickup:confirmed',
            'pickup:completed',
            'driver:on-duty',
            'driver:off-duty',
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * GET /api/admin/analytics/overview
   * Get system overview
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getOverview();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics/pickups
   * Get pickup analytics
   */
  async getPickupAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days as string) : 30;

      const analytics = await adminService.getPickupAnalytics(daysNum);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics/attendance
   * Get attendance analytics
   */
  async getAttendanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days as string) : 30;

      const analytics = await adminService.getAttendanceAnalytics(daysNum);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics/payments
   * Get payment analytics
   */
  async getPaymentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days as string) : 30;

      const analytics = await adminService.getPaymentAnalytics(daysNum);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
