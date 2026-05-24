/**
 * User Controller - Module Structure
 */

import { Request, Response } from 'express';
import { UserService, userService } from './user.service';

export class UserController {
  constructor(private service: UserService) {}

  /**
   * Get user by ID
   */
  async getUser(req: Request, res: Response) {
    const { id } = req.params;
    const user = await this.service.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    const user = await this.service.updateProfile(id, data);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
}

export const userController = new UserController(userService);
