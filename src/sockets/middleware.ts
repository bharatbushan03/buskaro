/**
 * Socket Authentication Middleware
 * 
 * Validates JWT tokens for WebSocket connections.
 */

import { Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth.middleware';
import { config } from '../config/app.config';
import { UserRole } from '../types/user.types';

// Extend Socket type to include user
declare module 'socket.io' {
  interface Socket {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void): void => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const tokenString = typeof token === 'string' ? token : token[0];
    const payload = verifyToken(tokenString, config.jwtSecret);

    if (payload.type !== 'access') {
      return next(new Error('Invalid token type'));
    }

    socket.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
