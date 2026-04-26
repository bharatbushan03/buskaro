/**
 * Notification Worker
 *
 * Background job processor for sending notifications:
 * - Push notifications
 * - SMS (future)
 * - Email (future)
 */

import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';
import { notificationService } from '../../modules/notifications/notification.service';
import { NotificationType } from '@prisma/client';

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Process notification job
 */
async function processNotification(job: Job): Promise<void> {
  const { userId, type, title, message, data, priority } = job.data;

  try {
    logger.info('Processing notification', { userId, type, jobId: job.id });

    // Send via notification service (creates DB record + socket)
    await notificationService.sendNotification({
      userId,
      type: type as NotificationType,
      title,
      message,
      data,
      priority: priority || 'medium',
      sendRealtime: true,
    });

    logger.info('Notification sent successfully', { userId, type, jobId: job.id });
  } catch (error) {
    logger.error('Failed to send notification', {
      error,
      userId,
      type,
      jobId: job.id,
    });
    throw error;
  }
}

/**
 * Process bulk notifications
 */
async function processBulkNotifications(job: Job): Promise<number> {
  const { notifications } = job.data;

  try {
    logger.info('Processing bulk notifications', {
      count: notifications.length,
      jobId: job.id,
    });

    let successCount = 0;

    for (const notification of notifications) {
      try {
        await notificationService.sendNotification({
          userId: notification.userId,
          type: notification.type as NotificationType,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority || 'medium',
          sendRealtime: true,
        });
        successCount++;
      } catch (error) {
        logger.error('Failed to send individual notification', {
          error,
          userId: notification.userId,
        });
      }
    }

    logger.info('Bulk notifications completed', {
      total: notifications.length,
      success: successCount,
      failed: notifications.length - successCount,
    });

    return successCount;
  } catch (error) {
    logger.error('Failed to process bulk notifications', { error, jobId: job.id });
    throw error;
  }
}

// Create worker
export const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    switch (job.name) {
      case 'send-notification':
        return processNotification(job);
      case 'bulk-notifications':
        return processBulkNotifications(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Higher concurrency for notifications
  }
);

// Handle worker events
notificationWorker.on('completed', (job) => {
  logger.info('Notification job completed', {
    jobId: job.id,
    name: job.name,
  });
});

notificationWorker.on('failed', (job, err: Error) => {
  logger.error('Notification job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export default notificationWorker;
