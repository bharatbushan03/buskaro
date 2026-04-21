/**
 * Bus Real-time Socket Handlers
 * 
 * Handles WebSocket events for bus tracking:
 * - Driver location updates
 * - Student bus tracking subscriptions
 * - Bus arrival notifications
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { redis, RedisKeys, RedisTTL } from '../config/redis.config';
import { BusLocationUpdate } from '../types/bus.types';

export const registerBusHandlers = (io: Server, socket: Socket): void => {
  // Driver: Update bus location
  socket.on('bus:location:update', async (data: BusLocationUpdate) => {
    try {
      if (socket.user?.role !== 'DRIVER') {
        socket.emit('error', { message: 'Only drivers can update location' });
        return;
      }

      // Store in Redis for quick access
      await redis.setex(
        RedisKeys.location(data.busId),
        RedisTTL.LOCATION,
        JSON.stringify({
          ...data.location,
          driverId: data.driverId,
          timestamp: new Date().toISOString(),
        })
      );

      // Broadcast to students tracking this bus
      io.to(`bus:${data.busId}`).emit('bus:location', {
        busId: data.busId,
        location: data.location,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Bus ${data.busId} location updated by ${data.driverId}`);
    } catch (error) {
      logger.error('Error updating bus location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Student: Subscribe to bus updates
  socket.on('bus:subscribe', async (busId: string) => {
    try {
      await socket.join(`bus:${busId}`);
      
      // Send current location if available
      const location = await redis.get(RedisKeys.location(busId));
      if (location) {
        socket.emit('bus:location', {
          busId,
          location: JSON.parse(location),
          timestamp: new Date().toISOString(),
        });
      }

      logger.debug(`Socket ${socket.id} subscribed to bus ${busId}`);
    } catch (error) {
      logger.error('Error subscribing to bus:', error);
    }
  });

  // Student: Unsubscribe from bus updates
  socket.on('bus:unsubscribe', async (busId: string) => {
    try {
      await socket.leave(`bus:${busId}`);
      logger.debug(`Socket ${socket.id} unsubscribed from bus ${busId}`);
    } catch (error) {
      logger.error('Error unsubscribing from bus:', error);
    }
  });

  // Driver: Start trip
  socket.on('bus:trip:start', (data: { busId: string; routeId: string }) => {
    if (socket.user?.role !== 'DRIVER') {
      socket.emit('error', { message: 'Only drivers can start trips' });
      return;
    }

    io.to(`bus:${data.busId}`).emit('bus:trip:started', {
      busId: data.busId,
      routeId: data.routeId,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip started for bus ${data.busId}`);
  });

  // Driver: End trip
  socket.on('bus:trip:end', (busId: string) => {
    if (socket.user?.role !== 'DRIVER') {
      socket.emit('error', { message: 'Only drivers can end trips' });
      return;
    }

    io.to(`bus:${busId}`).emit('bus:trip:ended', {
      busId,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip ended for bus ${busId}`);
  });
};
