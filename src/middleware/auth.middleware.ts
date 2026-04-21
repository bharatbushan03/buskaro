/**
 * JWT Authentication Middleware
 * 
 * Validates JWT tokens and attaches user context to requests.
 * Supports role-based access control (RBAC).
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app.config';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { UserRole } from '../types/user.types';

// JWT Payload structure
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
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
    { expiresIn: config.jwtAccessExpiration }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { userId, email, role, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiration }
  );
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

    // Attach user to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
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

    if (payload.type === 'access') {
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }

    next();
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
