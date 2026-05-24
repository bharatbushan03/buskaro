/**
 * Bus Routes - Module Structure
 *
 * Bus fleet management and real-time tracking
 */

import { Router } from 'express';
import { busController } from './bus.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/buses
 * @desc    List all buses
 * @access  Private
 */
router.get('/', authenticate, busController.getBuses);

/**
 * @route   GET /api/v1/buses/:id
 * @desc    Get bus details
 * @access  Private
 */
router.get('/:id', authenticate, busController.getBus);

/**
 * @route   POST /api/v1/buses
 * @desc    Create bus
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireRole(UserRole.ADMIN), busController.createBus);

/**
 * @route   PUT /api/v1/buses/:id
 * @desc    Update bus
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), busController.updateBus);

export { router as busRoutes };
