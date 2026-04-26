/**
 * System Maintenance Worker
 *
 * Background job processor for system maintenance:
 * - Cleanup old notifications
 * - Delete expired data
 * - Log rotation preparation
 * - Database optimization hints
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { notificationService } from '../../modules/notifications/notification.service';

const prisma = new PrismaClient();

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Daily cleanup job
 */
async function dailyCleanup(job: Job): Promise<{
  notificationsDeleted: number;
  expiredPickups: number;
}> {
  try {
    logger.info('Starting daily maintenance', { jobId: job.id });

    // 1. Cleanup old notifications (30 days)
    const notificationsDeleted = await notificationService.cleanupOldNotifications(30);

    // 2. Delete expired notifications
    const expiredNotifications = await notificationService.deleteExpired();

    // 3. Cleanup old pickup requests (90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldPickups = await prisma.pickupRequest.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: { in: ['EXPIRED', 'CANCELLED', 'COMPLETED'] },
      },
    });

    // 4. Cleanup old audit logs (180 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const oldAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: sixMonthsAgo },
      },
    });

    logger.info('Daily maintenance completed', {
      notificationsDeleted,
      expiredNotifications,
      oldPickups: oldPickups.count,
      oldAuditLogs: oldAuditLogs.count,
    });

    return {
      notificationsDeleted: notificationsDeleted + expiredNotifications,
      expiredPickups: oldPickups.count,
    };
  } catch (error) {
    logger.error('Daily maintenance failed', { error, jobId: job.id });
    throw error;
  }
}

/**
 * Health check job
 */
async function healthCheck(job: Job): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
}> {
  try {
    logger.debug('Running health check', { jobId: job.id });

    const checks: Record<string, boolean> = {
      database: false,
      redis: false,
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed', { error });
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!checks.database) {
      status = 'unhealthy';
    } else if (Object.values(checks).filter(Boolean).length < Object.keys(checks).length) {
      status = 'degraded';
    }

    logger.info('Health check completed', { status, checks });

    return { status, checks };
  } catch (error) {
    logger.error('Health check failed', { error, jobId: job.id });
    return { status: 'unhealthy', checks: {} };
  }
}

// Create worker
export const maintenanceWorker = new Worker(
  'system-maintenance',
  async (job: Job) => {
    switch (job.name) {
      case 'daily-cleanup':
        return dailyCleanup(job);
      case 'health-check':
        return healthCheck(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

// Handle worker events
maintenanceWorker.on('completed', (job) => {
  logger.info('Maintenance job completed', {
    jobId: job.id,
    name: job.name,
    result: job.returnvalue,
  });
});

maintenanceWorker.on('failed', (job, err: Error) => {
  logger.error('Maintenance job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export default maintenanceWorker;
