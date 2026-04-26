/**
 * Notification Service
 *
 * Business logic for notification management:
 * - Create various notification types
 * - Real-time socket delivery
 * - Read/unread management
 * - Bulk operations
 */

import { NotificationRepository, notificationRepository, CreateNotificationData } from './notification.repository';
import { NotificationType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  sendRealtime?: boolean;
}

export class NotificationService {
  constructor(private repository: NotificationRepository) {}

  /**
   * Send notification to user
   */
  async sendNotification(payload: NotificationPayload) {
    const { userId, type, title, message, data, priority, sendRealtime = true } = payload;

    try {
      // Store in database
      const notification = await this.repository.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
      });

      // Send real-time if requested
      if (sendRealtime) {
        this.sendRealtimeNotification(userId, {
          id: notification.id,
          type,
          title,
          message,
          data,
          priority,
          createdAt: notification.createdAt,
        });
      }

      logger.info('Notification sent', { userId, type, notificationId: notification.id });

      return notification;
    } catch (error) {
      logger.error('Failed to send notification', { error, userId, type });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(payloads: NotificationPayload[]) {
    const notifications = [];

    for (const payload of payloads) {
      try {
        const notification = await this.sendNotification(payload);
        notifications.push(notification);
      } catch (error) {
        logger.error('Failed to send bulk notification', { error, payload });
        // Continue with others
      }
    }

    return notifications;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, options: {
    status?: 'READ' | 'UNREAD';
    limit?: number;
    offset?: number;
    onlyRecent?: boolean;
  } = {}) {
    return this.repository.getUserNotifications(userId, {
      ...options,
      status: options.status as any,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.repository.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.getUnreadCount(userId);
  }

  // ==================== NOTIFICATION HELPERS ====================

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(userId: string, data: { amount: number; paymentId: string }) {
    return this.sendNotification({
      userId,
      type: 'PAYMENT' as NotificationType,
      title: 'Payment Successful',
      message: `Your payment of ₹${data.amount} has been received successfully.`,
      data: { paymentId: data.paymentId, amount: data.amount },
      priority: 'medium',
    });
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailed(userId: string, data: { amount: number; reason: string }) {
    return this.sendNotification({
      userId,
      type: 'PAYMENT' as NotificationType,
      title: 'Payment Failed',
      message: `Your payment of ₹${data.amount} failed. ${data.reason}`,
      data: { amount: data.amount, reason: data.reason },
      priority: 'high',
    });
  }

  /**
   * Send pickup confirmed notification
   */
  async sendPickupConfirmed(userId: string, data: { driverName: string; eta: string }) {
    return this.sendNotification({
      userId,
      type: 'PICKUP' as NotificationType,
      title: 'Pickup Confirmed',
      message: `${data.driverName} has accepted your pickup request. ETA: ${data.eta}`,
      data,
      priority: 'high',
    });
  }

  /**
   * Send pickup expired notification
   */
  async sendPickupExpired(userId: string) {
    return this.sendNotification({
      userId,
      type: 'PICKUP' as NotificationType,
      title: 'Pickup Expired',
      message: 'Your pickup request has expired. Please create a new request.',
      priority: 'medium',
    });
  }

  /**
   * Send bus arriving notification
   */
  async sendBusArriving(userId: string, data: { busNumber: string; etaMinutes: number; stopName: string }) {
    return this.sendNotification({
      userId,
      type: 'BUS' as NotificationType,
      title: 'Bus Approaching',
      message: `Bus ${data.busNumber} is arriving at ${data.stopName} in ${data.etaMinutes} minutes.`,
      data,
      priority: 'high',
    });
  }

  /**
   * Send attendance marked notification
   */
  async sendAttendanceMarked(userId: string, data: { status: string; busNumber: string; time: string }) {
    const statusText = data.status === 'PRESENT' ? 'present' : data.status === 'LATE' ? 'late' : 'marked';
    
    return this.sendNotification({
      userId,
      type: 'ATTENDANCE' as NotificationType,
      title: 'Attendance Marked',
      message: `You have been marked ${statusText} for bus ${data.busNumber} at ${data.time}.`,
      data,
      priority: 'medium',
    });
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(userId: string, title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    return this.sendNotification({
      userId,
      type: 'SYSTEM' as NotificationType,
      title,
      message,
      priority,
    });
  }

  /**
   * Send real-time notification via socket
   */
  private sendRealtimeNotification(userId: string, notification: any) {
    try {
      io.to(`user:${userId}`).emit('notification:new', {
        type: 'notification',
        data: notification,
      });

      logger.debug('Real-time notification sent', { userId, notificationId: notification.id });
    } catch (error) {
      logger.error('Failed to send real-time notification', { error, userId });
    }
  }

  /**
   * Cleanup old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30) {
    return this.repository.cleanupOldNotifications(daysToKeep);
  }

  /**
   * Delete expired notifications
   */
  async deleteExpired() {
    return this.repository.deleteExpired();
  }
}

export const notificationService = new NotificationService(notificationRepository);

