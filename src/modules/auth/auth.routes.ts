/**
 * Auth Routes
 * 
 * Defines API endpoints for authentication module.
 * Routes are mapped to controller methods with appropriate middleware.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate, commonValidations } from '../../middleware/validate.middleware';
import { 
  loginRateLimit, 
  registerRateLimit, 
  refreshRateLimit 
} from '../../middleware/rate-limit.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimit,
  validate([
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone.optional(),
  ]),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login existing user
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimit,
  validate([
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  refreshRateLimit,
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ]),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

export { router as authRoutes };
