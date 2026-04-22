/**
 * Rate Limiting Middleware
 * 
 * Provides configurable rate limiting for API endpoints.
 * Uses Redis for distributed rate limiting across multiple servers.
 * 
 * Features:
 * - IP-based limiting
 * - User-based limiting (when authenticated)
 * - Endpoint-specific limits
 * - Custom response messages
 */

import { Request, Response, NextFunction } from 'express';
import { redis, RedisTTL } from '../config/redis.config';
import { logger } from '../utils/logger';
import { AppError } from './error.middleware';

interface RateLimitConfig {
  // Maximum number of requests
  maxRequests: number;
  
  // Time window in seconds
  windowSeconds: number;
  
  // Key generator function (defaults to IP + optional user ID)
  keyGenerator?: (req: Request) => string;
  
  // Skip successful requests (only count failures)
  skipSuccessfulRequests?: boolean;
  
  // Skip function (e.g., skip for certain IPs)
  skip?: (req: Request) => boolean;
  
  // Custom error message
  message?: string;
  
  // HTTP status code when limit exceeded
  statusCode?: number;
}

// Rate limit configurations for different endpoints
export const RateLimitPresets = {
  // General API rate limit
  general: {
    maxRequests: 100,
    windowSeconds: 60,
    message: 'Too many requests, please try again later',
  },
  
  // Auth endpoints - strict to prevent brute force
  auth: {
    maxRequests: 5,
    windowSeconds: 60,
    message: 'Too many authentication attempts, please try again later',
  },
  
  // Login-specific - even stricter
  login: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    keyGenerator: (req: Request) => {
      // Use email from body as key, fallback to IP
      const email = req.body?.email;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return email ? `login:email:${email}` : `login:ip:${ip}`;
    },
    message: 'Too many login attempts. Please wait 5 minutes before trying again.',
    statusCode: 429,
  },
  
  // Registration - prevent spam
  register: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour per IP
    message: 'Too many registration attempts from this IP. Please try again later.',
  },
  
  // Password reset - strict
  passwordReset: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    message: 'Too many password reset attempts. Please try again later.',
  },
  
  // Refresh token - moderate
  refresh: {
    maxRequests: 10,
    windowSeconds: 60,
    message: 'Too many refresh attempts. Please try again later.',
  },
  
  // Real-time location updates - high limit
  location: {
    maxRequests: 60, // Once per second
    windowSeconds: 60,
    message: 'Too many location updates. Please slow down.',
  },
};

// Default key generator - uses IP + user ID if available
const defaultKeyGenerator = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = req.user?.id;
  return userId ? `rate:${userId}:${ip}` : `rate:ip:${ip}`;
};

// Rate limit middleware factory
export const rateLimit = (config: RateLimitConfig) => {
  const {
    maxRequests,
    windowSeconds,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skip,
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if we should skip this request
      if (skip && skip(req)) {
        return next();
      }

      // Generate rate limit key
      const key = `ratelimit:${keyGenerator(req)}`;
      
      // Get current count
      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      // Check if limit exceeded
      if (count >= maxRequests) {
        // Get TTL for the key
        const ttl = await redis.ttl(key);
        
        logger.warn(`Rate limit exceeded: ${key}`);
        
        return res.status(statusCode).json({
          success: false,
          error: {
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: ttl > 0 ? ttl : windowSeconds,
          },
        });
      }

      // Increment counter
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      
      // Set expiry on first request only
      if (count === 0) {
        pipeline.expire(key, windowSeconds);
      }
      
      await pipeline.exec();

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
      res.setHeader('X-RateLimit-Window', windowSeconds.toString());

      // Track response if skipSuccessfulRequests is enabled
      if (skipSuccessfulRequests) {
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          // Check if response indicates success (customize based on your API)
          const isSuccess = body?.success === true || res.statusCode < 400;
          
          if (!isSuccess) {
            // Don't decrement - the failed request still counts
            return originalJson(body);
          }
          
          // Decrement the counter for successful requests
          redis.decr(key).catch((err) => {
            logger.error('Failed to decrement rate limit counter:', err);
          });
          
          return originalJson(body);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

// Pre-configured middleware instances
export const generalRateLimit = rateLimit(RateLimitPresets.general);
export const authRateLimit = rateLimit(RateLimitPresets.auth);
export const loginRateLimit = rateLimit(RateLimitPresets.login);
export const registerRateLimit = rateLimit(RateLimitPresets.register);
export const passwordResetRateLimit = rateLimit(RateLimitPresets.passwordReset);
export const refreshRateLimit = rateLimit(RateLimitPresets.refresh);
export const locationRateLimit = rateLimit(RateLimitPresets.location);

// Custom rate limiter for specific use cases
export const createRateLimiter = (
  maxRequests: number,
  windowSeconds: number,
  options?: Partial<RateLimitConfig>
) => {
  return rateLimit({
    maxRequests,
    windowSeconds,
    ...options,
  });
};

// Sliding window rate limiter (more accurate but more expensive)
export const slidingWindowRateLimit = (config: RateLimitConfig) => {
  const {
    maxRequests,
    windowSeconds,
    keyGenerator = defaultKeyGenerator,
    skip,
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (skip && skip(req)) {
        return next();
      }

      const key = `ratelimit:sw:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Remove old entries outside the window
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const count = await redis.zcard(key);

      if (count >= maxRequests) {
        // Get oldest request to calculate retry-after
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = oldest.length > 1 
          ? Math.ceil((parseInt(oldest[1]) + windowSeconds * 1000 - now) / 1000)
          : windowSeconds;

        logger.warn(`Sliding window rate limit exceeded: ${key}`);

        return res.status(statusCode).json({
          success: false,
          error: {
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.max(retryAfter, 1),
          },
        });
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());

      next();
    } catch (error) {
      logger.error('Sliding window rate limiting error:', error);
      next();
    }
  };
};
