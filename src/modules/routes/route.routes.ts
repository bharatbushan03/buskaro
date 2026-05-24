/**
 * Route Routes - Module Structure
 *
 * Bus routes and pickup points management
 */

import { Router } from 'express';
import { routeController } from './route.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/routes
 * @desc    List all routes
 * @access  Private
 */
router.get('/', authenticate, routeController.getRoutes);

/**
 * @route   GET /api/v1/routes/:id
 * @desc    Get route details
 * @access  Private
 */
router.get('/:id', authenticate, routeController.getRoute);

/**
 * @route   POST /api/v1/routes
 * @desc    Create route
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireRole(UserRole.ADMIN), routeController.createRoute);

/**
 * @route   PUT /api/v1/routes/:id
 * @desc    Update route
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireRole(UserRole.ADMIN), routeController.updateRoute);

/**
 * @route   DELETE /api/v1/routes/:id
 * @desc    Delete route
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), routeController.deleteRoute);

export { router as routeRoutes };
