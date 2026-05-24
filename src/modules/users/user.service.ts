/**
 * User Service - Module Structure
 */

import { UserRepository, userRepository } from './user.repository';
import { AppError } from '../../middleware/error.middleware';

export class UserService {
  constructor(private repository: UserRepository) {}

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: any) {
    return this.repository.update(id, data);
  }
}

export const userService = new UserService(userRepository);
