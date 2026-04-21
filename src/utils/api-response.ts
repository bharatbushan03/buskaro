/**
 * API Response Utilities
 * 
 * Standardized response format for all API endpoints.
 * Ensures consistent structure across the application.
 */

import { Response } from 'express';

// Standard API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: ResponseMeta;
  errors?: ApiError[];
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

// Success response helper
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: Partial<ResponseMeta>
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  
  res.status(statusCode).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = 500,
  errors?: ApiError[]
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  
  res.status(statusCode).json(response);
};

// Pagination metadata builder
export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): ResponseMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  timestamp: new Date().toISOString(),
});

// Common HTTP status codes with messages
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Common response messages
export const ResponseMessages = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMITED: 'Too many requests',
} as const;
