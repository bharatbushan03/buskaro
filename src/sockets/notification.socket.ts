/**
 * Notification Real-time Socket Handlers
 * 
 * Handles WebSocket events for push notifications.
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { redis, RedisKeys, RedisTTL } from '../config/redis.config';

export const registerNotificationHandlers = (io: Server, socket: Socket): void => {
  // Join personal notification room
  socket.on('notifications:subscribe', async () => {
    if (!socket.user) return;

    const userRoom = `user:${socket.user.id}:notifications`;
    await socket.join(userRoom);
    
    // Store socket mapping in Redis for cross-server notifications
    await redis.setex(
      RedisKeys.socket(socket.user.id),
      RedisTTL.SESSION,
      socket.id
    );

    logger.debug(`User ${socket.user.id} subscribed to notifications`);
  });

  // Mark notification as read
  socket.on('notification:read', (notificationId: string) => {
    if (!socket.user) return;

    // TODO: Update notification status in database
    logger.debug(`Notification ${notificationId} marked as read by ${socket.user.id}`);
  });
};

/**
 * Emit notification to specific user (can be called from anywhere)
 */
export const emitNotification = async (
  io: Server,
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> => {
  const userRoom = `user:${userId}:notifications`;
  io.to(userRoom).emit('notification:new', notification);
};
