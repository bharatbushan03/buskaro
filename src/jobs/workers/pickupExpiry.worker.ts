/**
 * Pickup Expiry Worker
 *
 * Background job processor for handling expired pickups:
 * - Marks pickups as expired
 * - Notifies students
 * - Updates driver dashboards
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient, PickupRequestStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { notificationService } from '../../modules/notifications/notification.service';
import { io } from '../../sockets';
import { StudentEvents, AdminEvents, SocketRooms } from '../../sockets/events';

const prisma = new PrismaClient();

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Process pickup expiry job
 */
async function processPickupExpiry(job: Job): Promise<void> {
  const { pickupId, studentId } = job.data;

  try {
    logger.info('Processing pickup expiry', { pickupId, jobId: job.id });

    // Update pickup status to expired
    const updatedPickup = await prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { status: 'EXPIRED' as PickupRequestStatus },
      include: {
        student: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    // Notify student
    await notificationService.sendPickupExpired(studentId);

    // Emit socket event to student
    io.to(`student:${studentId}`).emit(StudentEvents.PICKUP_EXPIRED, {
      type: 'pickup_expired',
      data: {
        pickupId,
        timestamp: new Date().toISOString(),
      },
    });

    // Update admin dashboard
    io.to(SocketRooms.ADMIN_GLOBAL).emit(AdminEvents.DASHBOARD_UPDATE, {
      type: 'pickup_expired',
      data: {
        pickupId,
        studentId,
        expiredAt: new Date().toISOString(),
      },
    });

    logger.info('Pickup expiry processed successfully', {
      pickupId,
      studentId,
    });
  } catch (error) {
    logger.error('Failed to process pickup expiry', {
      error,
      pickupId,
      jobId: job.id,
    });
    throw error;
  }
}

/**
 * Process batch pickup expiry
 */
async function processBatchExpiry(job: Job): Promise<number> {
  try {
    logger.info('Processing batch pickup expiry', { jobId: job.id });

    const now = new Date();

    // Find all expired pickups
    const expiredPickups = await prisma.pickupRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { lt: now },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    if (expiredPickups.length === 0) {
      logger.info('No expired pickups found');
      return 0;
    }

    // Update all to expired
    await prisma.pickupRequest.updateMany({
      where: {
        id: { in: expiredPickups.map((p) => p.id) },
      },
      data: { status: 'EXPIRED' as PickupRequestStatus },
    });

    // Notify affected students
    for (const pickup of expiredPickups) {
      try {
        await notificationService.sendPickupExpired(pickup.studentId);

        io.to(`student:${pickup.studentId}`).emit(StudentEvents.PICKUP_EXPIRED, {
          type: 'pickup_expired',
          data: {
            pickupId: pickup.id,
            timestamp: now.toISOString(),
          },
        });
      } catch (notifyError) {
        logger.error('Failed to notify student of expiry', {
          error: notifyError,
          studentId: pickup.studentId,
          pickupId: pickup.id,
        });
      }
    }

    logger.info('Batch pickup expiry completed', {
      count: expiredPickups.length,
    });

    return expiredPickups.length;
  } catch (error) {
    logger.error('Failed to process batch expiry', { error, jobId: job.id });
    throw error;
  }
}

// Create worker
export const pickupExpiryWorker = new Worker(
  'pickup-expiry',
  async (job: Job) => {
    if (job.name === 'batch-expiry') {
      return processBatchExpiry(job);
    }
    return processPickupExpiry(job);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

// Handle worker events
pickupExpiryWorker.on('completed', (job) => {
  logger.info('Pickup expiry job completed', {
    jobId: job.id,
    name: job.name,
    result: job.returnvalue,
  });
});

pickupExpiryWorker.on('failed', (job, err) => {
  logger.error('Pickup expiry job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export default pickupExpiryWorker;
