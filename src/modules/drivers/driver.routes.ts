/**
 * Driver Routes
 * 
 * API endpoints for driver operations:
 * - Dashboard
 * - Trip management
 * - Route navigation
 * - Pickup handling
 */

import { Router } from 'express';
import { driverController } from './driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All driver routes require authentication and DRIVER role
router.use(authenticate);
router.use(requireRole(UserRole.DRIVER));

/**
 * @route   GET /api/drivers/dashboard
 * @desc    Get driver dashboard with all operational data
 * @access  Private (Driver)
 */
router.get('/dashboard', driverController.getDashboard);

/**
 * @route   GET /api/drivers/trip/status
 * @desc    Get current trip status
 * @access  Private (Driver)
 */
router.get('/trip/status', driverController.getTripStatus);

/**
 * @route   POST /api/drivers/start-trip
 * @desc    Start a new trip
 * @access  Private (Driver)
 */
router.post('/start-trip', driverController.startTrip);

/**
 * @route   POST /api/drivers/end-trip
 * @desc    End current trip
 * @access  Private (Driver)
 */
router.post('/end-trip', driverController.endTrip);

/**
 * @route   GET /api/drivers/route
 * @desc    Get navigation-ready route data (GeoJSON)
 * @access  Private (Driver)
 */
router.get('/route', driverController.getRoute);

/**
 * @route   GET /api/drivers/pickups/nearby
 * @desc    Get nearby pickups sorted by distance
 * @access  Private (Driver)
 */
router.get('/pickups/nearby', driverController.getNearbyPickups);

/**
 * @route   PATCH /api/drivers/pickups/:id/accept
 * @desc    Accept a pickup request
 * @access  Private (Driver)
 */
router.patch('/pickups/:id/accept', driverController.acceptPickup);

/**
 * @route   PATCH /api/drivers/pickups/:id/complete
 * @desc    Complete a pickup request
 * @access  Private (Driver)
 */
router.patch('/pickups/:id/complete', driverController.completePickup);

export default router;
