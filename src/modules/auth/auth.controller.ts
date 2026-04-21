/**
 * Auth Controller Layer
 * 
 * Handles HTTP requests and responses for authentication.
 * Delegates business logic to the service layer.
 */

import { Request, Response } from 'express';
import { AuthService, authService } from './auth.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { successResponse } from '../../utils/api-response';
import { LoginCredentials, RegisterData, UserRole } from '../../types/user.types';

export class AuthController {
  constructor(private service: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data: RegisterData = {
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role as UserRole,
    };

    const result = await this.service.register(data);

    successResponse(
      res,
      {
        userId: result.userId,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
      'User registered successfully',
      201
    );
  });

  /**
   * POST /api/v1/auth/login
   * Login existing user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials: LoginCredentials = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await this.service.login(credentials);

    successResponse(
      res,
      {
        userId: result.userId,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
      'Login successful'
    );
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    const tokens = await this.service.refreshToken(refreshToken);

    successResponse(
      res,
      tokens,
      'Token refreshed successfully'
    );
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const userId = req.user!.id;

    await this.service.logout(userId, refreshToken);

    successResponse(res, null, 'Logged out successfully');
  });

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await this.service.logoutAllDevices(userId);

    successResponse(res, null, 'Logged out from all devices');
  });

  /**
   * POST /api/v1/auth/change-password
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    await this.service.changePassword(userId, currentPassword, newPassword);

    successResponse(res, null, 'Password changed successfully');
  });

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // TODO: Fetch full user profile with role-specific data
    // For now, return basic info from token
    successResponse(
      res,
      {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      },
      'User profile retrieved'
    );
  });
}

// Export singleton instance
export const authController = new AuthController(authService);
