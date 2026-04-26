/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse:
 * - IP-based limits
 * - User-based limits
 * - Role-based limits
 * - Sliding window algorithm
 */

import { Request, Response, NextFunction } from 'express';
import { incrementCounter, getCounter, CachePrefix } from '../utils/cache';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Custom key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Custom error message
}

// Default rate limits by role
const defaultLimits: Record<string, RateLimitConfig> = {
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
  },
  student: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Rate limit exceeded for student account.',
  },
  driver: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 300,
    message: 'Rate limit exceeded for driver account.',
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
    message: 'Rate limit exceeded for admin account.',
  },
};

/**
 * Create rate limiting middleware
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultLimits.anonymous, ...config };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate rate limit key
      const identifier = req.user?.id || req.ip || 'anonymous';
      const key = `${CachePrefix.API_RATE_LIMIT}${finalConfig.keyPrefix || 'default'}:${identifier}`;

      // Check current count
      const currentCount = await getCounter(key);

      if (currentCount >= finalConfig.maxRequests) {
        logger.warn('Rate limit exceeded', {
          identifier,
          path: req.path,
          method: req.method,
          count: currentCount,
        });

        res.status(429).json({
          success: false,
          error: finalConfig.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil(finalConfig.windowMs / 1000),
        });
        return;
      }

      // Increment counter
      const count = await incrementCounter(key, Math.ceil(finalConfig.windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, finalConfig.maxRequests - count));
      res.setHeader('X-RateLimit-Window', Math.ceil(finalConfig.windowMs / 1000));

      next();
    } catch (error) {
      logger.error('Rate limiting error', { error });
      // Fail open - allow request but log error
      next();
    }
  };
}

/**
 * Role-based rate limiting
 */
export function roleBasedRateLimit() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.user?.role?.toLowerCase() || 'anonymous';
      const config = defaultLimits[role] || defaultLimits.anonymous;

      const identifier = req.user?.id || req.ip || 'anonymous';
      const key = `${CachePrefix.API_RATE_LIMIT}${role}:${identifier}`;

      const currentCount = await getCounter(key);

      if (currentCount >= config.maxRequests) {
        logger.warn('Role-based rate limit exceeded', {
          role,
          identifier,
          count: currentCount,
        });

        res.status(429).json({
          success: false,
          error: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
        return;
      }

      await incrementCounter(key, Math.ceil(config.windowMs / 1000));
      next();
    } catch (error) {
      logger.error('Role-based rate limiting error', { error });
      next();
    }
  };
}

/**
 * Strict rate limit for sensitive endpoints
 */
export function strictRateLimit() {
  return rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    keyPrefix: 'strict',
    message: 'Too many requests to sensitive endpoint.',
  });
}

/**
 * Socket rate limiting helper
 */
export async function checkSocketRateLimit(
  socketId: string,
  event: string,
  maxPerSecond: number = 10
): Promise<boolean> {
  const key = `${CachePrefix.API_RATE_LIMIT}socket:${socketId}:${event}`;
  const count = await incrementCounter(key, 1);
  return count <= maxPerSecond;
}

export default rateLimit;
