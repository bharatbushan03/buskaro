/**
 * Auth Repository Layer
 * 
 * Handles all database operations for authentication.
 * Abstracts Prisma client usage for the service layer.
 */

import { prisma } from '../../config/database.config';
import { User, UserStatus, UserRole } from '../../types/user.types';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserData {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
}

export class AuthRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user as User | null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as User | null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        phone: data.phone || null,
        role: data.role,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
        phoneVerified: false,
      },
    });
    return user as User;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return user as User;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Check if phone exists
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { phone },
    });
    return count > 0;
  }
}

// Export singleton instance
export const authRepository = new AuthRepository();
