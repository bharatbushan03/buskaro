/**
 * Global Error Handling Middleware
 * 
 * Centralized error handling following Express error-handling pattern.
 * Converts all errors to standardized API responses.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse, ApiError, HttpStatus } from '../utils/api-response';

// Custom Application Error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types for common scenarios
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', errors?: ApiError[]) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR');
    this.errors = errors;
  }
  errors?: ApiError[];
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errors: ApiError[] | undefined;
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    
    if (err instanceof ValidationError && err.errors) {
      errors = err.errors;
    }
  } else if (err.name === 'ValidationError' || err.name === 'PrismaClientValidationError') {
    // Handle Prisma or validation library errors
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma known errors
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = `Unique constraint violation on ${prismaError.meta?.target?.join(', ')}`;
      code = 'UNIQUE_VIOLATION';
    } else if (prismaError.code === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Record not found';
      code = 'NOT_FOUND';
    } else if (prismaError.code === 'P2003') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint failed';
      code = 'FOREIGN_KEY_ERROR';
    }
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]({
    message: err.message,
    code,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    userId: req.user?.id,
  });

  // Send response
  errorResponse(res, message, statusCode, errors);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
