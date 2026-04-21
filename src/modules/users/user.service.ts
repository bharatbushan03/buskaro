/**
 * User Service - Module Structure
 */

import { UserRepository, userRepository } from './user.repository';

export class UserService {
  constructor(private repository: UserRepository) {}
  
  // Student management
  // Driver management
  // Admin management
  // Profile operations
}

export const userService = new UserService(userRepository);
