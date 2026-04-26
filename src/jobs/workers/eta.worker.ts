/**
 * ETA Recalculation Worker
 *
 * Background job processor for ETA updates:
 * - Recalculate ETAs for active buses
 * - Batch update student notifications
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { etaService } from '../../modules/ai/eta.service';
import { notificationService } from '../../modules/notifications/notification.service';

const prisma = new PrismaClient();

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Recalculate ETA for all active buses
 */
async function recalculateAllETAs(job: Job): Promise<number> {
  try {
    logger.info('Starting ETA recalculation batch', { jobId: job.id });

    // Get all active trips with bus locations
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            currentLat: true,
            currentLng: true,
            students: {
              select: {
                id: true,
                userId: true,
                pickupPoint: {
                  select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    arrivalTime: true,
                  },
                },
              },
            },
          },
        },
        route: {
          select: {
            id: true,
            pickupPoints: {
              select: {
                id: true,
                latitude: true,
                longitude: true,
                sequenceOrder: true,
              },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const trip of activeTrips) {
      if (!trip.bus.currentLat || !trip.bus.currentLng) {
        continue;
      }

      for (const student of trip.bus.students) {
        if (!student.pickupPoint) continue;

        try {
          // Get stops ahead for this student
          const studentStopIndex = trip.route.pickupPoints.findIndex(
            (p) => p.id === student.pickupPoint?.id
          );

          const stopsAhead =
            studentStopIndex >= 0
              ? trip.route.pickupPoints.slice(studentStopIndex)
              : [];

          // Calculate ETA
          const eta = etaService.calculateETA({
            distanceKm: 0, // Will be calculated internally
            currentSpeedKmh: undefined,
            stopsAhead: stopsAhead.length,
            stopDurationSeconds: 30,
          });

          // Send notification if ETA changed significantly
          if (student.userId && eta.minutes > 0) {
            await notificationService.sendBusArriving(student.userId, {
              busNumber: trip.bus.registrationNumber,
              etaMinutes: eta.minutes,
              stopName: student.pickupPoint?.arrivalTime || 'Your stop',
            });

            updatedCount++;
          }
        } catch (error) {
          logger.error('Failed to recalculate ETA for student', {
            error,
            studentId: student.id,
            tripId: trip.id,
          });
        }
      }
    }

    logger.info('ETA recalculation batch completed', {
      activeTrips: activeTrips.length,
      notificationsSent: updatedCount,
    });

    return updatedCount;
  } catch (error) {
    logger.error('ETA recalculation batch failed', { error, jobId: job.id });
    throw error;
  }
}

/**
 * Cleanup old ETA cache
 */
async function cleanupETACache(job: Job): Promise<void> {
  try {
    logger.info('Cleaning up ETA cache', { jobId: job.id });
    etaService.clearCache();
    logger.info('ETA cache cleaned successfully');
  } catch (error) {
    logger.error('Failed to cleanup ETA cache', { error, jobId: job.id });
    throw error;
  }
}

// Create worker
export const etaWorker = new Worker(
  'eta-recalculation',
  async (job: Job) => {
    switch (job.name) {
      case 'recalculate-all':
        return recalculateAllETAs(job);
      case 'cleanup-cache':
        return cleanupETACache(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

// Handle worker events
etaWorker.on('completed', (job) => {
  logger.info('ETA job completed', {
    jobId: job.id,
    name: job.name,
    result: job.returnvalue,
  });
});

etaWorker.on('failed', (job, err: Error) => {
  logger.error('ETA job failed', {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export default etaWorker;
