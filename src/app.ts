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

// Import role-based routes
import adminRoutes from './modules/admin/admin.routes';
import driverRoutes from './modules/drivers/driver.routes';
import studentRoutes from './modules/students/student.routes';

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

  // Base API endpoint with full route map
  apiRouter.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to BusKaro API v1',
      version: '1.0.0',
      endpoints: {
        auth: {
          '/register': 'POST - Register user',
          '/login': 'POST - Login',
          '/refresh': 'POST - Refresh token',
          '/logout': 'POST - Logout',
          '/logout-all': 'POST - Logout all devices',
          '/change-password': 'POST - Change password',
          '/me': 'GET - Current user profile',
        },
        users: {
          '/:id': 'GET/PATCH - User profile management',
        },
        buses: {
          '/': 'GET - List buses, POST - Create bus (Admin)',
          '/:id': 'GET - Bus details, PUT - Update bus (Admin)',
        },
        routes: {
          '/': 'GET - List routes, POST - Create route (Admin)',
          '/:id': 'GET - Route details, PUT - Update route (Admin), DELETE - Delete route (Admin)',
        },
        pickups: {
          '/students/pin-location': 'POST - Create pickup pin',
          '/students/my-pin': 'GET - Get active pin',
          '/students/cancel-pin/:id': 'DELETE - Cancel pin',
          '/drivers/pickups': 'GET - Nearby pickups',
          '/drivers/pickup/:id/accept': 'PATCH - Accept pickup',
          '/drivers/pickup/:id/complete': 'PATCH - Complete pickup',
          '/pickups/stats': 'GET - Pickup statistics (Admin)',
        },
        payments: {
          '/my-fees': 'GET - My fees (Student)',
          '/initiate': 'POST - Initiate payment (Student)',
          '/verify': 'POST - Verify payment (Student)',
          '/': 'GET - All payments (Admin)',
          '/defaulters': 'GET - Payment defaulters (Admin)',
          '/stats': 'GET - Payment stats (Admin)',
          '/webhook': 'POST - Razorpay webhook (Public)',
        },
        attendance: {
          '/students/today': 'GET - Today attendance',
          '/students/history': 'GET - Attendance history',
          '/students/mark': 'POST - Mark attendance (Manual)',
          '/admin/': 'GET - All attendances (Admin)',
          '/admin/stats': 'GET - Attendance stats (Admin)',
          '/admin/manual': 'POST - Mark attendance (Admin)',
        },
        notifications: {
          '/': 'GET - My notifications',
          '/unread-count': 'GET - Unread count',
          '/:id/read': 'PATCH - Mark as read',
          '/mark-all-read': 'POST - Mark all read',
        },
        admin: {
          '/students': 'GET - List students',
          '/students/:id': 'GET - Student details',
          '/drivers': 'GET - List drivers',
          '/drivers/:id': 'GET - Driver details',
          '/create-driver': 'POST - Create driver',
          '/assign-bus': 'PATCH - Assign bus to driver',
          '/assign-student': 'PATCH - Assign student to bus/route',
          '/buses': 'GET - List buses, POST - Create bus',
          '/buses/:id': 'GET - Bus details, PATCH - Update bus',
          '/routes': 'GET - List routes, POST - Create route',
          '/routes/:id': 'GET - Route details, PATCH - Update route',
          '/live-buses': 'GET - Real-time monitoring',
          '/active-trips': 'GET - Active trips',
          '/join-monitoring': 'POST - Join real-time room',
          '/analytics/overview': 'GET - System overview',
          '/analytics/pickups': 'GET - Pickup analytics',
          '/analytics/attendance': 'GET - Attendance analytics',
          '/analytics/payments': 'GET - Payment analytics',
        },
        drivers: {
          '/dashboard': 'GET - Driver dashboard',
          '/trip/status': 'GET - Current trip status',
          '/start-trip': 'POST - Start trip',
          '/end-trip': 'POST - End trip',
          '/route': 'GET - Navigation route',
          '/pickups/nearby': 'GET - Nearby pickups',
          '/pickups/:id/accept': 'PATCH - Accept pickup',
          '/pickups/:id/complete': 'PATCH - Complete pickup',
        },
        students: {
          '/dashboard': 'GET - Student dashboard',
          '/track-bus': 'GET - Real-time tracking',
          '/route': 'GET - Route details',
          '/attendance': 'GET - Attendance summary',
          '/payments': 'GET - Payment history',
          '/pickup/active': 'GET - Active pickup status',
          '/join-bus-tracking': 'POST - Join tracking room',
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Register module routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/buses', busRoutes);
  apiRouter.use('/routes', routeRoutes);
  apiRouter.use('/pickups', pickupRoutes);
  apiRouter.use('/payments', paymentRoutes);
  apiRouter.use('/attendance', attendanceRoutes);
  apiRouter.use('/notifications', notificationRoutes);

  // Register role-based routes
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/drivers', driverRoutes);
  apiRouter.use('/students', studentRoutes);

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
