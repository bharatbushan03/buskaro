/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Provides role-based and permission-based access control for API endpoints.
 * 
 * Features:
 * - Role-based route protection
 * - Permission-based fine-grained access
 * - Resource ownership checks
 * - Role hierarchy support
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user.types';
import { AuthorizationError } from './error.middleware';
import { logger } from '../utils/logger';

/**
 * Permission definitions
 */
export enum Permission {
  // User management
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  
  // Bus management
  BUSES_VIEW = 'buses:view',
  BUSES_CREATE = 'buses:create',
  BUSES_UPDATE = 'buses:update',
  BUSES_DELETE = 'buses:delete',
  BUSES_LOCATION_UPDATE = 'buses:location:update',
  
  // Route management
  ROUTES_VIEW = 'routes:view',
  ROUTES_CREATE = 'routes:create',
  ROUTES_UPDATE = 'routes:update',
  ROUTES_DELETE = 'routes:delete',
  
  // Student management
  STUDENTS_VIEW = 'students:view',
  STUDENTS_CREATE = 'students:create',
  STUDENTS_UPDATE = 'students:update',
  STUDENTS_DELETE = 'students:delete',
  
  // Attendance
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_VERIFY = 'attendance:verify',
  
  // Payments
  PAYMENTS_VIEW = 'payments:view',
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_PROCESS = 'payments:process',
  PAYMENTS_REFUND = 'payments:refund',
  
  // Notifications
  NOTIFICATIONS_VIEW = 'notifications:view',
  NOTIFICATIONS_SEND = 'notifications:send',
  
  // Pickup points
  PICKUP_POINTS_VIEW = 'pickup_points:view',
  PICKUP_POINTS_CREATE = 'pickup_points:create',
  PICKUP_POINTS_UPDATE = 'pickup_points:update',
  PICKUP_POINTS_DELETE = 'pickup_points:delete',
  
  // PINs
  PINS_CREATE = 'pins:create',
  PINS_VERIFY = 'pins:verify',
  
  // System
  SYSTEM_ADMIN = 'system:admin',
  AUDIT_LOGS_VIEW = 'audit:logs:view',
  ANALYTICS_VIEW = 'analytics:view',
}

/**
 * Role to permissions mapping
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
  
  [UserRole.DRIVER]: [
    Permission.BUSES_VIEW,
    Permission.BUSES_LOCATION_UPDATE,
    Permission.ROUTES_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_VERIFY,
    Permission.PINS_VERIFY,
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_SEND,
    Permission.STUDENTS_VIEW,
    Permission.PICKUP_POINTS_VIEW,
  ],
  
  [UserRole.STUDENT]: [
    Permission.BUSES_VIEW,
    Permission.ROUTES_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.NOTIFICATIONS_VIEW,
    Permission.PICKUP_POINTS_VIEW,
    Permission.PINS_CREATE,
  ],
};

/**
 * Check if user has required role
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // User must be authenticated first (authenticate middleware should run before this)
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        logger.warn(
          `Role access denied: User ${req.user.id} with role ${userRole} attempted to access resource requiring ${roles.join(', ')}`
        );
        
        throw new AuthorizationError(
          `Access denied. Required role(s): ${roles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has required permission
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const userRole = req.user.role;
      const userPermissions = RolePermissions[userRole] || [];

      // Check if user has ALL required permissions
      const hasAllPermissions = permissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missing = permissions.filter(
          permission => !userPermissions.includes(permission)
        );
        
        logger.warn(
          `Permission denied: User ${req.user.id} missing permissions: ${missing.join(', ')}`
        );
        
        throw new AuthorizationError(
          `Access denied. Missing permissions: ${missing.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has ANY of the required permissions
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const userRole = req.user.role;
      const userPermissions = RolePermissions[userRole] || [];

      // Check if user has ANY of the required permissions
      const hasAnyPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        logger.warn(
          `Permission denied: User ${req.user.id} needs one of: ${permissions.join(', ')}`
        );
        
        throw new AuthorizationError(
          `Access denied. Requires one of: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user owns the resource or has admin permission
 * Use this for user-specific resources (profiles, orders, etc.)
 */
export const requireOwnershipOrAdmin = (
  paramName: string = 'userId',
  getUserIdFromBody: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const currentUserId = req.user.id;
      const targetUserId = getUserIdFromBody
        ? req.body[paramName]
        : req.params[paramName];

      // Allow if user owns the resource
      if (currentUserId === targetUserId) {
        return next();
      }

      // Allow if user is admin
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      logger.warn(
        `Ownership access denied: User ${currentUserId} attempted to access resource owned by ${targetUserId}`
      );

      throw new AuthorizationError(
        'Access denied. You can only access your own resources.'
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user owns the resource OR has specific permission
 * More flexible than requireOwnershipOrAdmin
 */
export const requireOwnershipOrPermission = (
  permission: Permission,
  paramName: string = 'userId',
  getUserIdFromBody: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const currentUserId = req.user.id;
      const targetUserId = getUserIdFromBody
        ? req.body[paramName]
        : req.params[paramName];

      // Allow if user owns the resource
      if (currentUserId === targetUserId) {
        return next();
      }

      // Allow if user has the specific permission
      const userPermissions = RolePermissions[req.user.role] || [];
      if (userPermissions.includes(permission)) {
        return next();
      }

      logger.warn(
        `Access denied: User ${currentUserId} attempted to access resource owned by ${targetUserId} without permission ${permission}`
      );

      throw new AuthorizationError(
        'Access denied. You can only access your own resources or require special permission.'
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource-based access control
 * Use this for resources with specific ownership (e.g., a bus route)
 */
export interface OwnableResource {
  ownerId?: string;
  allowedRoles?: UserRole[];
  allowedPermissions?: Permission[];
}

export const requireResourceAccess = (
  getResource: (req: Request) => Promise<OwnableResource | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const resource = await getResource(req);

      if (!resource) {
        throw new AuthorizationError('Resource not found');
      }

      const currentUserId = req.user.id;
      const userRole = req.user.role;
      const userPermissions = RolePermissions[userRole] || [];

      // Check ownership
      if (resource.ownerId && resource.ownerId === currentUserId) {
        return next();
      }

      // Check allowed roles
      if (resource.allowedRoles?.includes(userRole)) {
        return next();
      }

      // Check allowed permissions
      if (
        resource.allowedPermissions?.some(permission =>
          userPermissions.includes(permission)
        )
      ) {
        return next();
      }

      logger.warn(
        `Resource access denied: User ${currentUserId} attempted to access restricted resource`
      );

      throw new AuthorizationError('Access denied to this resource');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Convenience middleware combinations
 */

// Admin only
export const adminOnly = requireRole(UserRole.ADMIN);

// Driver only
export const driverOnly = requireRole(UserRole.DRIVER);

// Student only
export const studentOnly = requireRole(UserRole.STUDENT);

// Admin or Driver
export const adminOrDriver = requireRole(UserRole.ADMIN, UserRole.DRIVER);

// Any authenticated user
export const anyAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }
  next();
};

/**
 * Audit middleware - logs access to sensitive endpoints
 */
export const auditAccess = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      logger.info(
        `AUDIT: User ${req.user.id} (${req.user.role}) ${action} ${resource}`,
        {
          userId: req.user.id,
          role: req.user.role,
          resource,
          action,
          ip: req.ip,
          path: req.path,
        }
      );
    }
    next();
  };
};
