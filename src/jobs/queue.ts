/**
 * BullMQ Queue Setup
 *
 * Redis-based job queue configuration for background processing:
 * - Pickup expiry
 * - Notifications
 * - ETA recalculation
 * - System maintenance
 */

import { Queue, Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';

// Redis connection options
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Queue names
export enum QueueName {
  PICKUP_EXPIRY = 'pickup-expiry',
  NOTIFICATIONS = 'notifications',
  ETA_RECALCULATION = 'eta-recalculation',
  SYSTEM_MAINTENANCE = 'system-maintenance',
}

// Queue instances
export const queues: Record<string, Queue> = {};

/**
 * Initialize all queues
 */
export function initializeQueues(): void {
  try {
    // Pickup expiry queue
    queues[QueueName.PICKUP_EXPIRY] = new Queue(QueueName.PICKUP_EXPIRY, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    // Notifications queue
    queues[QueueName.NOTIFICATIONS] = new Queue(QueueName.NOTIFICATIONS, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });

    // ETA recalculation queue
    queues[QueueName.ETA_RECALCULATION] = new Queue(QueueName.ETA_RECALCULATION, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 500,
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    });

    // System maintenance queue
    queues[QueueName.SYSTEM_MAINTENANCE] = new Queue(QueueName.SYSTEM_MAINTENANCE, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    });

    logger.info('BullMQ queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize BullMQ queues', { error });
    throw error;
  }
}

/**
 * Add job to queue
 */
export async function addJob(
  queueName: QueueName,
  jobName: string,
  data: any,
  options?: any
): Promise<Job> {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  return queue.add(jobName, data, options);
}

/**
 * Add job with delay
 */
export async function addDelayedJob(
  queueName: QueueName,
  jobName: string,
  data: any,
  delayMs: number
): Promise<Job> {
  return addJob(queueName, jobName, data, {
    delay: delayMs,
  });
}

/**
 * Add recurring job (cron)
 */
export async function addCronJob(
  queueName: QueueName,
  jobName: string,
  data: any,
  cron: string
): Promise<Job> {
  return addJob(queueName, jobName, data, {
    repeat: {
      cron,
    },
  });
}

/**
 * Close all queues (for graceful shutdown)
 */
export async function closeQueues(): Promise<void> {
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    logger.info(`Queue ${name} closed`);
  }
}

export default queues;
