/**
 * HTTP Request Logging Middleware (Morgan)
 * 
 * Uses Morgan for request logging with Winston stream.
 * Excludes health checks to reduce noise.
 */

import morgan from 'morgan';
import { stream } from '../utils/logger';
import { config } from '../config/app.config';

// Skip logging for health check endpoint
const skipHealthCheck = (req: morgan.TokenIndexer): boolean => {
  return req.url === '/health';
};

// Custom token for request ID
morgan.token('requestId', (req: morgan.TokenIndexer) => {
  return req.requestId || 'unknown';
});

// Custom token for user ID if authenticated
morgan.token('userId', (req: morgan.TokenIndexer) => {
  return req.user?.id || 'anonymous';
});

// Development format (colorized, human-readable)
const devFormat = ':requestId :method :url :status :response-time ms - :userId';

// Production format (structured JSON)
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  contentLength: ':res[content-length]',
  requestId: ':requestId',
  userId: ':userId',
  timestamp: ':date[iso]',
});

// Select format based on environment
const format = config.nodeEnv === 'development' ? devFormat : prodFormat;

// Export configured morgan middleware
export const morganMiddleware = morgan(format, {
  stream,
  skip: skipHealthCheck,
});
