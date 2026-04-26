/**
 * Redis Cache Service
 *
 * Caching layer for performance optimization:
 * - Bus location data
 * - ETA results
 * - Frequent queries
 * - Rate limiting storage
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Redis client configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Cache key prefixes
export const CachePrefix = {
  BUS_LOCATION: 'bus:loc:',
  ETA: 'eta:',
  USER_SESSION: 'user:session:',
  API_RATE_LIMIT: 'ratelimit:',
  PICKUP_CLUSTER: 'pickup:cluster:',
  ROUTE_DATA: 'route:',
  NOTIFICATION_COUNT: 'notify:count:',
} as const;

// Default TTL values (seconds)
export const CacheTTL = {
  BUS_LOCATION: 30, // 30 seconds
  ETA: 60, // 1 minute
  USER_SESSION: 3600, // 1 hour
  PICKUP_CLUSTER: 300, // 5 minutes
  ROUTE_DATA: 600, // 10 minutes
  NOTIFICATION_COUNT: 60, // 1 minute
} as const;

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get failed', { error, key });
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = CacheTTL.ETA
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttlSeconds, serialized);
  } catch (error) {
    logger.error('Cache set failed', { error, key });
  }
}

/**
 * Delete cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete failed', { error, key });
  }
}

/**
 * Delete cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error('Cache pattern delete failed', { error, pattern });
  }
}

/**
 * Cache bus location
 */
export async function cacheBusLocation(
  busId: string,
  location: { lat: number; lng: number; speed?: number; timestamp: string }
): Promise<void> {
  const key = `${CachePrefix.BUS_LOCATION}${busId}`;
  await setCache(key, location, CacheTTL.BUS_LOCATION);
}

/**
 * Get cached bus location
 */
export async function getCachedBusLocation(
  busId: string
): Promise<{ lat: number; lng: number; speed?: number; timestamp: string } | null> {
  const key = `${CachePrefix.BUS_LOCATION}${busId}`;
  return getCache(key);
}

/**
 * Cache ETA result
 */
export async function cacheETA(
  busId: string,
  stopId: string,
  eta: { minutes: number; seconds: number; confidence: string; updatedAt: string }
): Promise<void> {
  const key = `${CachePrefix.ETA}${busId}:${stopId}`;
  await setCache(key, eta, CacheTTL.ETA);
}

/**
 * Get cached ETA
 */
export async function getCachedETA(
  busId: string,
  stopId: string
): Promise<{ minutes: number; seconds: number; confidence: string; updatedAt: string } | null> {
  const key = `${CachePrefix.ETA}${busId}:${stopId}`;
  return getCache(key);
}

/**
 * Increment counter with expiry
 */
export async function incrementCounter(
  key: string,
  expirySeconds: number
): Promise<number> {
  try {
    const multi = redisClient.multi();
    multi.incr(key);
    multi.expire(key, expirySeconds);
    const results = await multi.exec();
    return results?.[0]?.[1] as number || 1;
  } catch (error) {
    logger.error('Counter increment failed', { error, key });
    return 1;
  }
}

/**
 * Get counter value
 */
export async function getCounter(key: string): Promise<number> {
  try {
    const value = await redisClient.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    logger.error('Counter get failed', { error, key });
    return 0;
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redisClient.flushdb();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache clear failed', { error });
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keys: number;
}> {
  try {
    const info = await redisClient.info('keyspace');
    const keysMatch = info.match(/keys=(\d+)/);
    const keys = keysMatch ? parseInt(keysMatch[1], 10) : 0;

    return {
      connected: redisClient.status === 'ready',
      keys,
    };
  } catch (error) {
    logger.error('Cache stats failed', { error });
    return { connected: false, keys: 0 };
  }
}

// Redis connection events
redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('error', (error) => {
  logger.error('Redis error', { error });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

export { redisClient };
export default redisClient;
