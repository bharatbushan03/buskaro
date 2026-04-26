/**
 * Notification Routes
 *
 * API endpoints for notifications:
 * - Get my notifications
 * - Mark as read
 * - Get unread count
 */

import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get my notifications
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/mark-all-read', notificationController.markAllAsRead);

export { router as notificationRoutes };
export default router;
