/**
 * JWT Authentication Middleware
 * 
 * Validates JWT tokens and attaches user context to requests.
 * Supports role-based access control (RBAC).
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app.config';
import { prisma } from '../config/database.config';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { UserRole } from '../types/user.types';

// JWT Payload structure
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  sub?: string;  // JWT subject claim (used for refresh token rotation)
  iat: number;
  exp: number;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        studentId?: string;
        driverId?: string;
        adminId?: string;
      };
    }
  }
}

/**
 * Verify JWT token and extract payload
 */
export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { userId, email, role, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiration as any }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { sub: userId, userId, email, role, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiration as any }
  );
};

/**
 * Verify refresh token and extract payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
};

/**
 * Main authentication middleware
 * Validates JWT from Authorization header
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token, config.jwtSecret);

    // Ensure it's an access token
    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        student: { select: { id: true } },
        driver: { select: { id: true } },
        admin: { select: { id: true } },
      },
    })
      .then((user) => {
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          studentId: user?.student?.id,
          driverId: user?.driver?.id,
          adminId: user?.admin?.id,
        };

        next();
      })
      .catch(() => next(new AuthenticationError('Invalid token')));
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid token'));
    }
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token valid, but doesn't require it
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token, config.jwtSecret);

    if (payload.type !== 'access') {
      return next();
    }

    prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        student: { select: { id: true } },
        driver: { select: { id: true } },
        admin: { select: { id: true } },
      },
    })
      .then((user) => {
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          studentId: user?.student?.id,
          driverId: user?.driver?.id,
          adminId: user?.admin?.id,
        };

        next();
      })
      .catch(() => next());
  } catch {
    // Ignore errors for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * @param allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(
        `Required role: ${allowedRoles.join(' or ')}`
      ));
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own resources
 * Admin users can access any resource
 */
export const authorizeOwnerOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  const { id } = req.params;
  const isOwner = req.user.id === id;
  const isAdmin = req.user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return next(new AuthorizationError('You can only access your own resources'));
  }

  next();
};
