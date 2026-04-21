/**
 * Request Context Middleware
 * 
 * Attaches a unique request ID to each request for distributed tracing.
 * Enables request correlation across logs.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate or extract request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Attach to request
  req.requestId = requestId;
  req.startTime = Date.now();
  
  // Add to response headers for client correlation
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
