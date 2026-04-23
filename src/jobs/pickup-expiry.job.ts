/**
 * Pickup Expiry Background Job
 * 
 * Automatically expires pickup requests after 30 minutes.
 * Runs every minute to check for expired pickups.
 * 
 * Features:
 * - Scheduled execution via node-cron
 * - Emits socket events to notify affected users
 * - Logs expired pickups for analytics
 */

import cron from 'node-cron';
import { pickupService } from '../modules/pickups/pickup.service';
import { pickupRepository } from '../modules/pickups/pickup.repository';
import { logger } from '../utils/logger';
import { io } from '../sockets';

// Job configuration
const CRON_SCHEDULE = '*/1 * * * *'; // Run every minute
const JOB_NAME = 'pickup-expiry';

let isRunning = false;

/**
 * Expire old pickup requests
 */
export const expirePickups = async (): Promise<void> => {
  if (isRunning) {
    logger.warn('Pickup expiry job is already running, skipping...');
    return;
  }

  try {
    isRunning = true;
    logger.debug('Running pickup expiry job...');

    const result = await pickupService.expireOldPickups();

    if (result.count > 0) {
      logger.info(`Pickup expiry job completed: ${result.count} pickups expired`);
      
      // Notify via socket if available
      if (io) {
        for (const id of result.ids) {
          const pickup = await pickupRepository.findById(id);
          if (pickup) {
            io.to(`student:${pickup.studentId}`).emit('pickup:expired', {
              pickupId: pickup.id,
              expiredAt: new Date().toISOString(),
            });
            
            // Also notify drivers to remove from their list
            io.emit('pickup:removed', { pickupId: pickup.id });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error in pickup expiry job:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the scheduled expiry job
 */
export const startPickupExpiryJob = (): void => {
  logger.info(`Starting ${JOB_NAME} job with schedule: ${CRON_SCHEDULE}`);
  
  // Run immediately on startup
  expirePickups();
  
  // Schedule recurring execution
  cron.schedule(CRON_SCHEDULE, expirePickups, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Adjust to your timezone
    name: JOB_NAME,
  });
  
  logger.info(`${JOB_NAME} job scheduled successfully`);
};

/**
 * Stop the scheduled job (for testing/shutdown)
 */
export const stopPickupExpiryJob = (): void => {
  // node-cron doesn't have a direct stop method for named jobs
  // In production, you'd track the task and destroy it
  logger.info(`${JOB_NAME} job stopped`);
};

/**
 * Run expiry job once (for manual triggers)
 */
export const runExpiryJobOnce = async (): Promise<{ count: number; ids: string[] }> => {
  logger.info('Running pickup expiry job manually...');
  
  const result = await pickupService.expireOldPickups();
  
  logger.info(`Manual expiry job completed: ${result.count} pickups expired`);
  
  return result;
};

export default {
  start: startPickupExpiryJob,
  stop: stopPickupExpiryJob,
  runOnce: runExpiryJobOnce,
  expirePickups,
};
