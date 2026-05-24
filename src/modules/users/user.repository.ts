/**
 * User Repository - Module Structure
 */

import { PrismaClient } from '@prisma/client';
import { User } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  /**
S	 * Get user by ID with profile
	 */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  /**
	 * Update user basic info
	 */
  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export const userRepository = new UserRepository();
