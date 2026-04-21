/**
 * Structured Logging System
 * 
 * Uses Winston with daily rotation for production-grade logging.
 * Supports multiple transports and structured JSON logging.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config/app.config';

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (human readable in development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logs directory path
const logsDir = path.isAbsolute(config.logFilePath) 
  ? config.logFilePath 
  : path.join(process.cwd(), config.logFilePath);

// File transports with rotation
const fileTransports: winston.transport[] = [
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
  }),
];

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: config.nodeEnv === 'development' ? consoleFormat : logFormat,
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { service: 'buskaro-api' },
  transports: [
    consoleTransport,
    ...(config.nodeEnv !== 'test' ? fileTransports : []),
  ],
  // Don't exit on error
  exitOnError: false,
});

// Stream for Morgan HTTP logging
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

// Request context logger (adds request ID to logs)
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Performance logger
export const logPerformance = (operation: string, durationMs: number, metadata?: Record<string, unknown>): void => {
  logger.info(`Performance: ${operation}`, {
    duration: durationMs,
    ...metadata,
  });
};

// Audit logger for security events
export const auditLog = (action: string, userId: string, details: Record<string, unknown>): void => {
  logger.info(`Audit: ${action}`, {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  });
};
