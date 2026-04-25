/**
 * Student Controller
 * 
 * HTTP request handlers for student endpoints:
 * - GET /api/students/dashboard
 * - GET /api/students/track-bus
 * - GET /api/students/route
 * - GET /api/students/attendance
 * - GET /api/students/payments
 */

import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';
import { SocketRooms } from '../../sockets/events';

export class StudentController {
  /**
   * GET /api/students/dashboard
   * Get comprehensive dashboard data for authenticated student
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const dashboard = await studentService.getDashboard(studentId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/track-bus
   * Get real-time bus tracking data
   */
  async trackBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const trackingData = await studentService.trackBus(studentId);

      // Auto-join bus room for real-time updates
      // Note: In actual implementation, client should connect via WebSocket
      // This endpoint returns current state

      res.status(200).json({
        success: true,
        data: trackingData,
        socketRoom: `${SocketRooms.BUS_PREFIX}${trackingData.busId}`,
        hint: 'Connect to socket room for real-time updates',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/route
   * Get route navigation data
   */
  async getRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const routeData = await studentService.getRoute(studentId);

      res.status(200).json({
        success: true,
        data: routeData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/attendance
   * Get attendance summary
   */
  async getAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const attendanceData = await studentService.getAttendance(studentId);

      res.status(200).json({
        success: true,
        data: attendanceData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/payments
   * Get payment summary
   */
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const paymentData = await studentService.getPayments(studentId);

      res.status(200).json({
        success: true,
        data: paymentData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/pickup/active
   * Get active pickup request status
   */
  async getActivePickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const { studentRepository } = await import('./student.repository');
      const activePickup = await studentRepository.getActivePickup(studentId);

      res.status(200).json({
        success: true,
        data: {
          hasActivePickup: !!activePickup,
          pickup: activePickup ? {
            id: activePickup.id,
            status: activePickup.status,
            lat: activePickup.latitude,
            lng: activePickup.longitude,
            address: activePickup.address,
            requestedAt: activePickup.requestedAt,
            expiresAt: activePickup.expiresAt,
            driver: activePickup.driver ? {
              name: activePickup.driver.name,
              phone: activePickup.driver.phone,
            } : null,
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/students/join-bus-tracking
   * Join socket room for real-time bus updates
   */
  async joinBusTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      // Get student's assigned bus
      const { studentRepository } = await import('./student.repository');
      const student = await studentRepository.getStudentWithAssignments(studentId);

      if (!student?.bus) {
        throw new AppError('No bus assigned', 404);
      }

      const busRoom = `${SocketRooms.BUS_PREFIX}${student.bus.id}`;

      res.status(200).json({
        success: true,
        message: 'Socket room info for bus tracking',
        data: {
          busId: student.bus.id,
          socketRoom: busRoom,
          events: [
            'bus:location-update',
            'bus:eta-update',
            'pickup:confirmed',
            'pickup:expired',
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
