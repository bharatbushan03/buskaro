/**
 * Notification Controller
 *
 * HTTP request handlers for notification endpoints:
 * - GET /api/notifications
 * - PATCH /api/notifications/:id/read
 * - POST /api/notifications/mark-all-read
 */

import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { AppError } from '../../middleware/error.middleware';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get user's notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, limit, offset, onlyRecent } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        status: status as 'READ' | 'UNREAD',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        onlyRecent: onlyRecent === 'true',
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await notificationService.markAsRead(id, userId);

      if (result.count === 0) {
        throw new AppError('Notification not found or already read', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/mark-all-read
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `${result.count} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
