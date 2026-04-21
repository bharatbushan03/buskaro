/**
 * Express Application Factory
 * 
 * Creates and configures the Express application with all middleware
 * and route registrations. Follows factory pattern for testability.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/app.config';
import { logger, stream } from './utils/logger';
import { morganMiddleware } from './middleware/morgan.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requestContext } from './middleware/context.middleware';

// Import routes
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { busRoutes } from './modules/buses/bus.routes';
import { routeRoutes } from './modules/routes/route.routes';
import { pickupRoutes } from './modules/pickups/pickup.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { attendanceRoutes } from './modules/attendance/attendance.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(morganMiddleware);

  // Request context (attach request ID for tracing)
  app.use(requestContext);

  // Health check endpoint (before API prefix)
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'BusKaro API is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API Routes - versioned
  const apiRouter = express.Router();

  // Register module routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/buses', busRoutes);
  apiRouter.use('/routes', routeRoutes);
  apiRouter.use('/pickups', pickupRoutes);
  apiRouter.use('/payments', paymentRoutes);
  apiRouter.use('/attendance', attendanceRoutes);
  apiRouter.use('/notifications', notificationRoutes);

  // Mount API router
  app.use(config.apiPrefix, apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.originalUrl} not found`
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
