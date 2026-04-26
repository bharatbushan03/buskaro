/**
 * Job Scheduler
 *
 * Cron-based job scheduling for periodic tasks:
 * - Pickup expiry checks
 * - ETA recalculations
 * - System maintenance
 */

import { QueueName, addCronJob, initializeQueues, queues } from './queue';
import { logger } from '../utils/logger';

/**
 * Initialize all scheduled jobs
 */
export async function initializeScheduler(): Promise<void> {
  try {
    // Initialize queues first
    initializeQueues();

    logger.info('Initializing job scheduler...');

    // 1. Pickup expiry check - every 5 minutes
    await addCronJob(
      QueueName.PICKUP_EXPIRY,
      'batch-expiry',
      {},
      '*/5 * * * *'
    );
    logger.info('Scheduled: Pickup expiry check (every 5 minutes)');

    // 2. ETA recalculation - every 2 minutes
    await addCronJob(
      QueueName.ETA_RECALCULATION,
      'recalculate-all',
      {},
      '*/2 * * * *'
    );
    logger.info('Scheduled: ETA recalculation (every 2 minutes)');

    // 3. ETA cache cleanup - every 15 minutes
    await addCronJob(
      QueueName.ETA_RECALCULATION,
      'cleanup-cache',
      {},
      '*/15 * * * *'
    );
    logger.info('Scheduled: ETA cache cleanup (every 15 minutes)');

    // 4. System maintenance - daily at 2 AM
    await addCronJob(
      QueueName.SYSTEM_MAINTENANCE,
      'daily-cleanup',
      {},
      '0 2 * * *'
    );
    logger.info('Scheduled: System maintenance (daily at 2 AM)');

    logger.info('Job scheduler initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduler', { error });
    throw error;
  }
}

/**
 * Schedule a one-time delayed job
 */
export async function scheduleDelayed(
  queueName: QueueName,
  jobName: string,
  data: any,
  delayMs: number
): Promise<void> {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  await queue.add(jobName, data, { delay: delayMs });
  logger.info(`Scheduled delayed job: ${jobName} in ${delayMs}ms`);
}

/**
 * Graceful shutdown
 */
export async function shutdownScheduler(): Promise<void> {
  logger.info('Shutting down scheduler...');

  // Close all queues
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    logger.info(`Queue ${name} closed`);
  }

  logger.info('Scheduler shutdown complete');
}
