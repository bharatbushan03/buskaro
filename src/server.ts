/**
 * BusKaro Backend - Application Entry Point
 * 
 * Architecture: Layered architecture with dependency injection pattern
 * - Handles graceful startup/shutdown
 * - Initializes database connections
 * - Sets up real-time socket handlers
 */

import { config } from './config/app.config';
import { logger } from './utils/logger';
import { prisma } from './config/database.config';
import { redis } from './config/redis.config';
import { createApp } from './app';
import { createServer } from 'http';
import { initializeSockets } from './sockets';

const startServer = async (): Promise<void> => {
  try {
    // Validate critical configuration
    config.validate();

    // Test database connectivity
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test Redis connectivity
    await redis.ping();
    logger.info('✅ Redis connected successfully');

    // Create Express app
    const app = createApp();
    const httpServer = createServer(app);

    // Initialize Socket.io for real-time features
    initializeSockets(httpServer);
    logger.info('✅ Socket.io initialized');

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 BusKaro server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        await redis.disconnect();
        logger.info('Redis connection closed');

        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the application
startServer();
