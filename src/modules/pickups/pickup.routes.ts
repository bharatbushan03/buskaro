/**
 * Pickup Routes
 * 
 * API routes for dynamic pickup request system.
 * 
 * Student Routes:
 * - POST /api/students/pin-location - Create pickup pin
 * - GET  /api/students/my-pin        - Get active pin
 * - DELETE /api/students/cancel-pin/:id - Cancel pin
 * 
 * Driver Routes:
 * - GET /api/drivers/pickups         - Get nearby pickups
 * - PATCH /api/drivers/pickup/:id/accept - Accept pickup
 * - PATCH /api/drivers/pickup/:id/complete - Complete pickup
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { pickupController } from './pickup.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { studentOnly, driverOnly, adminOnly } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

// Validation rules
const latitudeValidation = body('latitude')
  .isFloat({ min: -90, max: 90 })
  .withMessage('Latitude must be between -90 and 90');

const longitudeValidation = body('longitude')
  .isFloat({ min: -180, max: 180 })
  .withMessage('Longitude must be between -180 and 180');

// ==================== STUDENT ROUTES ====================

/**
 * POST /api/students/pin-location
 * Create a new pickup pin
 */
router.post(
  '/students/pin-location',
  authenticate,
  studentOnly,
  validate([
    latitudeValidation,
    longitudeValidation,
    body('address').optional().isString().trim(),
    body('accuracy').optional().isFloat({ min: 0, max: 100 }),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ]),
  pickupController.createPin
);

/**
 * GET /api/students/my-pin
 * Get student's active pickup request
 */
router.get(
  '/students/my-pin',
  authenticate,
  studentOnly,
  pickupController.getMyPin
);

/**
 * DELETE /api/students/cancel-pin/:id
 * Cancel a pickup request
 */
router.delete(
  '/students/cancel-pin/:id',
  authenticate,
  studentOnly,
  validate([
    param('id').isUUID().withMessage('Invalid pickup ID'),
  ]),
  pickupController.cancelPin
);

// ==================== DRIVER ROUTES ====================

/**
 * GET /api/drivers/pickups
 * Get nearby pending pickup requests
 */
router.get(
  '/drivers/pickups',
  authenticate,
  driverOnly,
  validate([
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
  ]),
  pickupController.getNearbyPickups
);

/**
 * PATCH /api/drivers/pickup/:id/accept
 * Accept a pickup request
 */
router.patch(
  '/drivers/pickup/:id/accept',
  authenticate,
  driverOnly,
  validate([
    param('id').isUUID().withMessage('Invalid pickup ID'),
  ]),
  pickupController.acceptPickup
);

/**
 * PATCH /api/drivers/pickup/:id/complete
 * Complete a pickup request
 */
router.patch(
  '/drivers/pickup/:id/complete',
  authenticate,
  driverOnly,
  validate([
    param('id').isUUID().withMessage('Invalid pickup ID'),
  ]),
  pickupController.completePickup
);

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/pickups/stats
 * Get pickup statistics
 */
router.get(
  '/pickups/stats',
  authenticate,
  adminOnly,
  pickupController.getStats
);

export { router as pickupRoutes };
