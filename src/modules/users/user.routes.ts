/**
 * User Routes - Module Structure
 *
 * User management for all roles (student/driver/admin)
 */

import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, userController.getUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/:id', authenticate, userController.updateProfile);

export { router as userRoutes };
