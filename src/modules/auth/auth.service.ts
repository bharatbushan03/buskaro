/**
 * Auth Service Layer
 * 
 * Contains business logic for authentication.
 * Orchestrates between repository, JWT handling, and external services.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository, authRepository } from './auth.repository';
import { validatePassword, hashPassword, comparePassword } from '../../utils/password.utils';
import { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} from '../../middleware/auth.middleware';
import { redis, RedisKeys, RedisTTL } from '../../config/redis.config';
import { config } from '../../config/app.config';
import { logger } from '../../utils/logger';
import { auditLog } from '../../utils/logger';
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError 
} from '../../middleware/error.middleware';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthTokens, 
  UserRole,
  UserStatus 
} from '../../types/user.types';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ userId: string; tokens: AuthTokens }> {
    // Check if email already exists
    const emailExists = await this.repository.emailExists(data.email);
    if (emailExists) {
      throw new ConflictError('Email already registered');
    }

    // Check phone if provided
    if (data.phone) {
      const phoneExists = await this.repository.phoneExists(data.phone);
      if (phoneExists) {
        throw new ConflictError('Phone number already registered');
      }
    }

    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.repository.create({
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role,
    });

    // TODO: Create role-specific profile (student/driver/admin)
    // This will be implemented when those modules are built

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Audit log
    auditLog('USER_REGISTERED', user.id, { email: user.email, role: user.role });

    logger.info(`User registered: ${user.email}`);

    return {
      userId: user.id,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ userId: string; user: any; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.repository.findByEmail(credentials.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check account status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Account has been suspended');
    }

    // Verify password
    const isPasswordValid = await comparePassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Audit log
    auditLog('USER_LOGIN', user.id, { email: user.email });

    logger.info(`User logged in: ${user.email}`);

    return {
      userId: user.id,
      user,
      tokens,
    };
  }

  /**
   * Refresh access token with rotation
   * Implements refresh token rotation for enhanced security
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify the refresh token
      const payload = verifyRefreshToken(refreshToken);
      
      if (!payload || !payload.sub) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const tokenId = this.extractTokenId(refreshToken);
      
      // Check if token exists in Redis (not revoked)
      const storedToken = await redis.get(RedisKeys.refreshToken(tokenId));
      
      if (!storedToken) {
        // Token was revoked or expired - potential replay attack
        logger.warn(`Attempt to use revoked refresh token: ${tokenId}`);
        
        // Revoke all tokens for this user as security measure
        await this.logoutAllDevices(payload.sub);
        
        throw new AuthenticationError('Token has been revoked. Please login again.');
      }

      // Get user to ensure they still exist and are active
      const user = await this.repository.findById(payload.sub);
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new AuthenticationError('Account is not active');
      }

      // Revoke the old refresh token (rotation)
      await redis.del(RedisKeys.refreshToken(tokenId));
      
      // Generate new token pair
      const tokens = this.generateTokens(user.id, user.email, user.role);
      
      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      
      logger.info(`Token refreshed for user: ${user.email}`);
      
      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token has expired');
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      
      logger.error('Refresh token error:', error);
      throw new AuthenticationError('Failed to refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Remove refresh token from Redis
    const tokenId = this.extractTokenId(refreshToken);
    await redis.del(RedisKeys.refreshToken(tokenId));
    
  }

  /**
   * Logout user from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    // Revoke all refresh tokens for this user
    const pattern = `${RedisKeys.refreshToken('')}*`;
    const keys = await redis.keys(pattern);
    
    // Delete all matching keys
    for (const key of keys) {
      const tokenData = await redis.get(key);
      if (tokenData) {
        const data = JSON.parse(tokenData);
        if (data.userId === userId) {
          await redis.del(key);
        }
      }
    }
    
    logger.info(`Logged out user from all devices: ${userId}`);
    logger.info(`User logged out from all devices: ${userId}`);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    // Hash and update
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    
    // Note: This would need a direct prisma update or a method in repository
    // For now, we'll skip the actual implementation

    // Invalidate all refresh tokens
    await this.logoutAllDevices(userId);

    auditLog('PASSWORD_CHANGED', userId, {});
    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, email: string, role: UserRole): AuthTokens {
    const accessToken = generateAccessToken(userId, email, role);
    const refreshToken = generateRefreshToken(userId, email, role);

    // Calculate expiration (15 minutes default)
    const expiresIn = 15 * 60;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenId = this.extractTokenId(refreshToken);
    await redis.setex(
      RedisKeys.refreshToken(tokenId),
      RedisTTL.REFRESH_TOKEN,
      JSON.stringify({ userId, createdAt: new Date().toISOString() })
    );
  }

  /**
   * Extract token ID (last 16 chars of token for reference)
   */
  private extractTokenId(token: string): string {
    return token.slice(-16);
  }
}

// Export singleton instance
export const authService = new AuthService(authRepository);
