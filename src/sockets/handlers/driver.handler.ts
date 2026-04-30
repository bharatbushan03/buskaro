import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const registerDriverHandlers = (io: Server, socket: Socket): void => {
  const userId = socket.user?.id || 'anonymous';
  
  // Driver location update
  socket.on('driver:location-update', (data: { lat: number; lng: number; busId?: string }) => {
    logger.debug(`Driver ${userId} location update: ${data.lat}, ${data.lng}`);
    
    // Broadcast to students tracking this driver
    socket.to(`driver:${userId}`).emit('driver:location', {
      driverId: userId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Driver status change
  socket.on('driver:status-change', (data: { status: 'ONLINE' | 'OFFLINE' | 'ON_TRIP' }) => {
    logger.info(`Driver ${userId} status changed to ${data.status}`);
    
    socket.broadcast.emit('driver:status-change', {
      driverId: userId,
      status: data.status,
      timestamp: new Date().toISOString(),
    });
  });

  // Trip started
  socket.on('driver:trip-started', (data: { routeId: string; busId: string }) => {
    logger.info(`Driver ${userId} started trip on route ${data.routeId}`);
    socket.broadcast.emit('trip:started', {
      driverId: userId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Trip ended
  socket.on('driver:trip-ended', (data: { routeId: string; busId: string }) => {
    logger.info(`Driver ${userId} ended trip on route ${data.routeId}`);
    socket.broadcast.emit('trip:ended', {
      driverId: userId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  });
};
