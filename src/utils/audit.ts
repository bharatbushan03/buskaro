/**
 * Audit Logging Utility
 * 
 * Logs administrative actions for compliance and security.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export interface AuditLogData {
  [key: string]: any;
}

/**
 * Log an administrative action
 */
export async function auditLog(
  action: string,
  userId: string,
  details: AuditLogData,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    });

    logger.info('Audit log created', { action, userId, details });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    logger.error('Failed to create audit log', { error, action, userId });
  }
}

/**
 * Get recent audit logs
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    include: {
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
}
