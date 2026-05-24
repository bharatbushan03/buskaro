/**
 * Bus Repository
 */

import { PrismaClient, BusStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class BusRepository {
  async getBuses(filters: {
    status?: BusStatus;
    routeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.routeId) where.currentRouteId = filters.routeId;

    const [buses, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        include: {
          driver: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, name: true } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus.count({ where }),
    ]);

    return { buses, total };
  }

  async getBusById(busId: string) {
    return prisma.bus.findUnique({
      where: { id: busId },
      include: {
        driver: { include: { user: true } },
        route: { include: { pickupPoints: true } },
        students: { select: { id: true, name: true } },
      },
    });
  }

  async createBus(data: any) {
    return prisma.bus.create({
      data: {
        ...data,
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        permitExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async updateBus(busId: string, data: any) {
    return prisma.bus.update({
      where: { id: busId },
      data,
      include: {
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, name: true } },
      },
    });
  }
}

export const busRepository = new BusRepository();
