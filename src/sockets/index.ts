/**
 * Socket.io Initialization
 * 
 * Sets up real-time WebSocket connections for:
 * - Bus location tracking
 * - Driver location updates
 * - Student notifications
 * - Admin dashboards
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';
import { config } from '../config/app.config';
import { authenticateSocket } from './middleware';
import { registerBusHandlers } from './bus.socket';
import { registerNotificationHandlers } from './notification.socket';

let io: SocketServer;

export const initializeSockets = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(authenticateSocket);

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.user?.id || 'anonymous'}`);

    // Register module-specific handlers
    registerBusHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Export for use in other modules
export { io };
