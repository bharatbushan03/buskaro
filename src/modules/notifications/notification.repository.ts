/**
 * Notification Repository
 *
 * Database operations for notification management:
 * - Create and store notifications
 * - Mark as read/unread
 * - Query user notifications
 * - Bulk operations
 */

import { PrismaClient, NotificationType, NotificationStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        priority: data.priority || 'medium',
        status: 'UNREAD',
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
      onlyRecent?: boolean;
    } = {}
  ) {
    const { status, limit = 50, offset = 0, onlyRecent = false } = options;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (onlyRecent) {
      // Last 7 days
      where.createdAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    }

    // Exclude expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, status: 'UNREAD' },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        status: 'UNREAD',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  /**
   * Delete old read notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.notification.deleteMany({
      where: {
        status: 'READ',
        readAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  /**
   * Delete expired notifications
   */
  async deleteExpired() {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Deleted ${result.count} expired notifications`);
    }

    return result.count;
  }

  /**
   * Get notification by ID
   */
  async getById(notificationId: string, userId: string) {
    return prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Bulk create notifications
   */
  async createMany(data: CreateNotificationData[]) {
    return prisma.notification.createMany({
      data: data.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data || {},
        priority: item.priority || 'medium',
        status: 'UNREAD' as const,
        expiresAt: item.expiresAt,
      })),
      skipDuplicates: true,
    });
  }
}

export const notificationRepository = new NotificationRepository();

