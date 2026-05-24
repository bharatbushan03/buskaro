/**
 * Database Configuration (Prisma)
 * 
 * Singleton Prisma client instance with connection pooling.
 * Prisma is used as the ORM for type-safe database operations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from './app.config';
import { logger } from '../utils/logger';

// Prisma client with query logging in development
const prismaOptions: Prisma.PrismaClientOptions = config.nodeEnv === 'development' 
  ? {
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    }
  : {
      log: [
        { emit: 'event', level: 'error' },
      ],
    };

// Singleton instance
export const prisma = new PrismaClient(prismaOptions);

// Event listeners for query logging (development only)
if (config.nodeEnv === 'development') {
  // @ts-expect-error - Prisma event typing
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`Prisma Query: ${e.query} (${e.duration}ms)`);
  });
  
  // @ts-expect-error - Prisma event typing
  prisma.$on('error', (e: { message: string }) => {
    logger.error(`Prisma Error: ${e.message}`);
  });
}

// Graceful shutdown helper
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

// Connection test helper
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};
