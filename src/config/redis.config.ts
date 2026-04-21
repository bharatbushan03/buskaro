/**
 * Redis Configuration
 * 
 * Redis is used for:
 * - Session management
 * - Real-time location caching
 * - Rate limiting counters
 * - Pub/Sub for notifications
 */

import Redis from 'ioredis';
import { config } from './app.config';
import { logger } from '../utils/logger';

// Redis client singleton
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: config.nodeEnv === 'development',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
    return targetErrors.some(e => err.message.includes(e));
  }
});

// Event handlers
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err.message);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Key prefixes for different features
export const RedisKeys = {
  session: (userId: string) => `session:${userId}`,
  refreshToken: (tokenId: string) => `refresh:${tokenId}`,
  location: (busId: string) => `location:${busId}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  otp: (email: string) => `otp:${email}`,
  cache: (key: string) => `cache:${key}`,
  socket: (userId: string) => `socket:${userId}`,
} as const;

// TTL constants (in seconds)
export const RedisTTL = {
  SESSION: 24 * 60 * 60,        // 24 hours
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  LOCATION: 5 * 60,              // 5 minutes
  RATE_LIMIT: 15 * 60,           // 15 minutes
  OTP: 10 * 60,                  // 10 minutes
  CACHE: 60 * 60,                // 1 hour
} as const;

// Redis helper functions
export const redisHelpers = {
  // Set JSON value
  setJSON: async (key: string, value: unknown, ttl?: number): Promise<void> => {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  // Get JSON value
  getJSON: async <T>(key: string): Promise<T | null> => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) as T : null;
  },

  // Delete key
  delete: async (key: string): Promise<void> => {
    await redis.del(key);
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    const result = await redis.exists(key);
    return result === 1;
  },

  // Get TTL
  ttl: async (key: string): Promise<number> => {
    return await redis.ttl(key);
  },
};
