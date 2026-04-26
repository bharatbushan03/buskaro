/**
 * Attendance Controller
 *
 * HTTP request handlers for attendance endpoints:
 * - Student: view today's attendance, history
 * - Admin: view all attendance, statistics, manual marking
 * - Socket integration for auto-marking
 */

import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';
import { AppError } from '../../middleware/error.middleware';
import { UserRole } from '@prisma/client';

export class AttendanceController {
  /**
   * GET /api/students/attendance/today
   * Get student's attendance for today
   */
  async getTodayAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const attendance = await attendanceService.getTodayAttendance(studentId);

      res.status(200).json({
        success: true,
        data: {
          hasAttendance: !!attendance,
          attendance,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/students/attendance/history
   * Get student's attendance history
   */
  async getStudentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

      const history = await attendanceService.getStudentHistory(studentId, limit);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/students/mark-attendance
   * Manual attendance marking (fallback)
   */
  async markAttendanceManual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const { busId, routeId, lat, lng, status, reason } = req.body;

      if (!busId || !routeId || !lat || !lng || !status) {
        throw new AppError('Missing required fields: busId, routeId, lat, lng, status', 400);
      }

      const attendance = await attendanceService.markAttendanceManually({
        studentId,
        busId,
        routeId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        status,
        markedBy: studentId,
        reason,
      });

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/attendance
   * Get all attendances with filters (admin view)
   */
  async getAllAttendances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, routeId, studentId, busId, status, page, limit } = req.query;

      const result = await attendanceService.getAllAttendances({
        date: date ? new Date(date as string) : undefined,
        routeId: routeId as string,
        studentId: studentId as string,
        busId: busId as string,
        status: status as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.attendances,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 50)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/attendance/stats
   * Get attendance statistics
   */
  async getAttendanceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;

      const stats = await attendanceService.getAttendanceStats(
        date ? new Date(date as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/attendance/manual
   * Admin manual attendance marking
   */
  async markAttendanceAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;

      const { studentId, busId, routeId, lat, lng, status, reason } = req.body;

      if (!studentId || !busId || !routeId || !lat || !lng || !status) {
        throw new AppError(
          'Missing required fields: studentId, busId, routeId, lat, lng, status',
          400
        );
      }

      const attendance = await attendanceService.markAttendanceManually({
        studentId,
        busId,
        routeId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        status,
        markedBy: adminId,
        reason: reason || 'Marked by admin',
      });

      res.status(201).json({
        success: true,
        message: 'Attendance marked by admin successfully',
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
