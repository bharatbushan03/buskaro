/**
 * Request Validation Middleware
 * 
 * Uses express-validator for declarative validation.
 * Provides standardized validation error responses.
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './error.middleware';
import { ApiError } from '../utils/api-response';

/**
 * Middleware to run validations and handle errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for API response
    const formattedErrors: ApiError[] = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg,
      code: 'INVALID_VALUE',
    }));

    next(new ValidationError('Validation failed', formattedErrors));
  };
};

// Common validation chains
export const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),

  // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),

  // UUID validation for IDs
  id: (field: string) => param(field)
    .isUUID(4)
    .withMessage(`Invalid ${field} format`),

  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Phone number (Indian format)
  phone: body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),

  // OTP (6 digits)
  otp: body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
};

// Export validation methods for convenience
export { body, param, query };
