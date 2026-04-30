import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const registerStudentHandlers = (io: Server, socket: Socket): void => {
  const userId = socket.user?.id || 'anonymous';
  
  // Student subscribes to driver location updates
  socket.on('student:track-driver', (data: { driverId: string }) => {
    logger.debug(`Student ${userId} tracking driver ${data.driverId}`);
    socket.join(`driver:${data.driverId}`);
  });

  // Student stops tracking driver
  socket.on('student:untrack-driver', (data: { driverId: string }) => {
    logger.debug(`Student ${userId} stopped tracking driver ${data.driverId}`);
    socket.leave(`driver:${data.driverId}`);
  });

  // Student requests pickup
  socket.on('student:request-pickup', (data: { location: { lat: number; lng: number }; driverId?: string }) => {
    logger.info(`Student ${userId} requested pickup at ${data.location.lat}, ${data.location.lng}`);
    
    // Notify admin and available drivers
    socket.to('admin:global').emit('pickup:requested', {
      studentId: userId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Student cancels pickup
  socket.on('student:cancel-pickup', (data: { pickupId: string }) => {
    logger.info(`Student ${userId} cancelled pickup ${data.pickupId}`);
    
    socket.to('admin:global').emit('pickup:cancelled', {
      studentId: userId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  });
};
