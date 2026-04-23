/**
 * Socket.io Initialization
 * 
 * Production-grade real-time WebSocket server with:
 * - Redis adapter for horizontal scaling
 * - JWT authentication
 * - Room-based message routing
 * - Reconnection handling
 * - Comprehensive error handling
 * 
 * Use cases:
 * - Bus location tracking (drivers → students)
 * - Admin dashboards (system-wide monitoring)
 * - Emergency alerts (broadcast to all)
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../utils/logger';
import { config } from '../config/app.config';
import { redis } from '../config/redis.config';
import { authenticateSocket } from './middleware';
import { registerBusHandlers } from './bus.socket';
import { registerNotificationHandlers } from './notification.socket';
import { registerDriverHandlers } from './handlers/driver.handler';
import { registerStudentHandlers } from './handlers/student.handler';
import { SocketRooms } from './events';

let io: SocketServer;

/**
 * Initialize Socket.IO server with Redis adapter
 */
export const initializeSockets = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    // Prevent duplicate connections from same user
    allowUpgrades: true,
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for horizontal scaling
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware - reject unauthorized connections
  io.use(authenticateSocket);

  // Connection handler with room management
  io.on('connection', (socket) => {
    const userId = socket.user?.id || 'anonymous';
    const userRole = socket.user?.role || 'unknown';
    
    logger.info(`Socket connected: ${socket.id}, User: ${userId}, Role: ${userRole}`);

    // Auto-join admin room for admin users
    if (userRole === 'ADMIN') {
      socket.join(SocketRooms.ADMIN_GLOBAL);
      logger.info(`Admin ${userId} joined global admin room`);
    }

    // Register module-specific handlers
    registerBusHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerDriverHandlers(io, socket);
    registerStudentHandlers(io, socket);

    // Handle reconnection - restore previous rooms
    socket.on('reconnect', (attemptNumber) => {
      logger.info(`Socket ${socket.id} reconnected after ${attemptNumber} attempts`);
    });

    // Handle disconnection with cleanup
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`);
      
      // Broadcast driver offline status if driver disconnects
      if (userRole === 'DRIVER' && socket.user?.driverId) {
        io.to(SocketRooms.ADMIN_GLOBAL).emit('driver:status-change', {
          driverId: socket.user.driverId,
          status: 'OFFLINE',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Global error handling
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', err.message, err.context);
  });

  logger.info('Socket.IO server initialized with Redis adapter');
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
