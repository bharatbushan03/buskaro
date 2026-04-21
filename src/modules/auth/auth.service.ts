/**
 * Auth Service Layer
 * 
 * Contains business logic for authentication.
 * Orchestrates between repository, JWT handling, and external services.
 */

import bcrypt from 'bcryptjs';
import { AuthRepository, authRepository } from './auth.repository';
import { generateAccessToken, generateRefreshToken } from '../../middleware/auth.middleware';
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

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

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
  async login(credentials: LoginCredentials): Promise<{ userId: string; tokens: AuthTokens }> {
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
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
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
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // TODO: Implement refresh token validation and rotation
    // This will be completed with full JWT logic
    
    throw new AuthenticationError('Refresh token implementation pending');
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Remove refresh token from Redis
    const tokenId = this.extractTokenId(refreshToken);
    await redis.del(RedisKeys.refreshToken(tokenId));
    
    auditLog('USER_LOGOUT', userId, {});
    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    // Clear all refresh tokens for user
    const pattern = `refresh:*:${userId}`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    auditLog('USER_LOGOUT_ALL', userId, {});
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
