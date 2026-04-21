/**
 * Application Configuration
 * 
 * Centralized configuration management with validation.
 * Uses environment variables with sensible defaults.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  
  // Security
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Logging
  logLevel: string;
  logFilePath: string;
}

const getEnvVar = (name: string, required: boolean = true, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (required && !value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || '';
};

const getNumberEnvVar = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  return value ? parseInt(value, 10) : defaultValue;
};

export const config: Config = {
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  port: getNumberEnvVar('PORT', 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  databaseUrl: getEnvVar('DATABASE_URL'),
  redisUrl: getEnvVar('REDIS_URL', false, 'redis://localhost:6379'),
  
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtRefreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
  jwtAccessExpiration: getEnvVar('JWT_ACCESS_EXPIRATION', false, '15m'),
  jwtRefreshExpiration: getEnvVar('JWT_REFRESH_EXPIRATION', false, '7d'),
  
  bcryptRounds: getNumberEnvVar('BCRYPT_ROUNDS', 12),
  rateLimitWindowMs: getNumberEnvVar('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: getNumberEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
  
  logLevel: process.env.LOG_LEVEL || 'info',
  logFilePath: process.env.LOG_FILE_PATH || './logs'
};

// Validation method - attached after creation
const validateConfig = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
};

// Attach validate method
Object.assign(config, { validate: validateConfig });
