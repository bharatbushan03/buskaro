/**
 * Student Routes
 * 
 * API endpoints for student operations:
 * - Dashboard
 * - Bus tracking
 * - Route navigation
 * - Attendance and payments
 */

import { Router } from 'express';
import { studentController } from './student.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All student routes require authentication and STUDENT role
router.use(authenticate);
router.use(requireRole(UserRole.STUDENT));

/**
 * @route   GET /api/students/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Private (Student)
 */
router.get('/dashboard', studentController.getDashboard);

/**
 * @route   GET /api/students/track-bus
 * @desc    Get real-time bus tracking data
 * @access  Private (Student)
 */
router.get('/track-bus', studentController.trackBus);

/**
 * @route   GET /api/students/route
 * @desc    Get route navigation data with stops
 * @access  Private (Student)
 */
router.get('/route', studentController.getRoute);

/**
 * @route   GET /api/students/attendance
 * @desc    Get attendance summary and history
 * @access  Private (Student)
 */
router.get('/attendance', studentController.getAttendance);

/**
 * @route   GET /api/students/payments
 * @desc    Get payment summary and history
 * @access  Private (Student)
 */
router.get('/payments', studentController.getPayments);

/**
 * @route   GET /api/students/pickup/active
 * @desc    Get active pickup request status
 * @access  Private (Student)
 */
router.get('/pickup/active', studentController.getActivePickup);

/**
 * @route   POST /api/students/join-bus-tracking
 * @desc    Get socket room info for real-time bus tracking
 * @access  Private (Student)
 */
router.post('/join-bus-tracking', studentController.joinBusTracking);

export default router;
