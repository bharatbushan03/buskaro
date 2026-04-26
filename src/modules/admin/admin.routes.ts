/**
 * Admin Routes
 * 
 * API endpoints for admin operations:
 * - User management
 * - Fleet management
 * - Real-time monitoring
 * - Analytics
 */

import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

// ==================== USER MANAGEMENT ====================

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with filters
 * @access  Private (Admin)
 */
router.get('/students', adminController.getStudents);

/**
 * @route   GET /api/admin/students/:id
 * @desc    Get student details
 * @access  Private (Admin)
 */
router.get('/students/:id', adminController.getStudentDetails);

/**
 * @route   GET /api/admin/drivers
 * @desc    Get all drivers with filters
 * @access  Private (Admin)
 */
router.get('/drivers', adminController.getDrivers);

/**
 * @route   GET /api/admin/drivers/:id
 * @desc    Get driver details
 * @access  Private (Admin)
 */
router.get('/drivers/:id', adminController.getDriverDetails);

/**
 * @route   POST /api/admin/create-driver
 * @desc    Create a new driver (placeholder)
 * @access  Private (Admin)
 */
router.post('/create-driver', adminController.createDriver);

/**
 * @route   PATCH /api/admin/assign-bus
 * @desc    Assign bus to driver
 * @access  Private (Admin)
 */
router.patch('/assign-bus', adminController.assignBus);

/**
 * @route   PATCH /api/admin/assign-student
 * @desc    Assign bus/route to student
 * @access  Private (Admin)
 */
router.patch('/assign-student', adminController.assignStudent);

// ==================== BUS & ROUTE MANAGEMENT ====================

/**
 * @route   GET /api/admin/buses
 * @desc    Get all buses
 * @access  Private (Admin)
 */
router.get('/buses', adminController.getBuses);

/**
 * @route   GET /api/admin/buses/:id
 * @desc    Get bus details
 * @access  Private (Admin)
 */
router.get('/buses/:id', adminController.getBusDetails);

/**
 * @route   POST /api/admin/buses
 * @desc    Create a new bus
 * @access  Private (Admin)
 */
router.post('/buses', adminController.createBus);

/**
 * @route   PATCH /api/admin/buses/:id
 * @desc    Update bus
 * @access  Private (Admin)
 */
router.patch('/buses/:id', adminController.updateBus);

/**
 * @route   GET /api/admin/routes
 * @desc    Get all routes
 * @access  Private (Admin)
 */
router.get('/routes', adminController.getRoutes);

/**
 * @route   GET /api/admin/routes/:id
 * @desc    Get route details
 * @access  Private (Admin)
 */
router.get('/routes/:id', adminController.getRouteDetails);

/**
 * @route   POST /api/admin/routes
 * @desc    Create a new route
 * @access  Private (Admin)
 */
router.post('/routes', adminController.createRoute);

/**
 * @route   PATCH /api/admin/routes/:id
 * @desc    Update route
 * @access  Private (Admin)
 */
router.patch('/routes/:id', adminController.updateRoute);

// ==================== REAL-TIME MONITORING ====================

/**
 * @route   GET /api/admin/live-buses
 * @desc    Get real-time bus monitoring
 * @access  Private (Admin)
 */
router.get('/live-buses', adminController.getLiveBuses);

/**
 * @route   GET /api/admin/active-trips
 * @desc    Get active trips
 * @access  Private (Admin)
 */
router.get('/active-trips', adminController.getActiveTrips);

/**
 * @route   POST /api/admin/join-monitoring
 * @desc    Get socket room info for real-time monitoring
 * @access  Private (Admin)
 */
router.post('/join-monitoring', adminController.joinMonitoring);

// ==================== ANALYTICS ====================

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get system overview statistics
 * @access  Private (Admin)
 */
router.get('/analytics/overview', adminController.getOverview);

/**
 * @route   GET /api/admin/analytics/pickups
 * @desc    Get pickup analytics
 * @access  Private (Admin)
 */
router.get('/analytics/pickups', adminController.getPickupAnalytics);

/**
 * @route   GET /api/admin/analytics/attendance
 * @desc    Get attendance analytics
 * @access  Private (Admin)
 */
router.get('/analytics/attendance', adminController.getAttendanceAnalytics);

/**
 * @route   GET /api/admin/analytics/payments
 * @desc    Get payment analytics
 * @access  Private (Admin)
 */
router.get('/analytics/payments', adminController.getPaymentAnalytics);

export default router;
