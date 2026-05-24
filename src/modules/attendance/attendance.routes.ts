/**
 * Attendance Routes
 * 
 * Student attendance tracking and verification:
 * - Automated attendance via socket triggers
 * - Manual attendance fallback
 * - Admin attendance management
 */

import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// ==================== STUDENT ENDPOINTS ====================

// Student attendance routes require STUDENT role
const studentRouter = Router();
studentRouter.use(authenticate, requireRole(UserRole.STUDENT));

/**
 * @route   GET /api/students/attendance/today
 * @desc    Get student's attendance for today
 * @access  Private (Student)
 */
studentRouter.get('/today', attendanceController.getTodayAttendance);

/**
 * @route   GET /api/students/attendance/history
 * @desc    Get student's attendance history
 * @access  Private (Student)
 */
studentRouter.get('/history', attendanceController.getStudentHistory);

/**
 * @route   POST /api/students/mark-attendance
 * @desc    Manual attendance marking (fallback)
 * @access  Private (Student)
 */
studentRouter.post('/mark', attendanceController.markAttendanceManual);

// ==================== ADMIN ENDPOINTS ====================

// Admin attendance routes require ADMIN role
const adminRouter = Router();
adminRouter.use(authenticate, requireRole(UserRole.ADMIN));

/**
 * @route   GET /api/admin/attendance
 * @desc    Get all attendances with filters
 * @access  Private (Admin)
 */
adminRouter.get('/', attendanceController.getAllAttendances);

/**
 * @route   GET /api/admin/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (Admin)
 */
adminRouter.get('/stats', attendanceController.getAttendanceStats);

/**
 * @route   POST /api/admin/attendance/manual
 * @desc    Admin manual attendance marking
 * @access  Private (Admin)
 */
adminRouter.post('/manual', attendanceController.markAttendanceAdmin);

  // Mount role-specific routers to the main module router
  router.use('/students', studentRouter);
  router.use('/admin', adminRouter);

  export { router as attendanceRoutes };
