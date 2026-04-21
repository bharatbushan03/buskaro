/**
 * User Controller - Module Structure
 */

import { UserService, userService } from './user.service';

export class UserController {
  constructor(private service: UserService) {}
  
  // CRUD operations for users
  // Profile endpoints
  // Role-specific endpoints
}

export const userController = new UserController(userService);
