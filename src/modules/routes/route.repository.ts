/**
 * Route Repository
 */

import { PrismaClient, RouteStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class RouteRepository {
  async getRoutes(filters: {
    status?: RouteStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: {
          buses: { select: { id: true, registrationNumber: true, status: true } },
          pickupPoints: { orderBy: { sequenceOrder: 'asc' } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    return { routes, total };
  }

  async getRouteById(routeId: string) {
    return prisma.route.findUnique({
      where: { id: routeId },
      include: {
        buses: { include: { driver: true } },
        pickupPoints: { orderBy: { sequenceOrder: 'asc' } },
        students: { select: { id: true, name: true } },
      },
    });
  }

  async createRoute(data: any) {
    return prisma.route.create({ data });
  }

  async updateRoute(routeId: string, data: any) {
    return prisma.route.update({
      where: { id: routeId },
      data,
      include: { buses: true },
    });
  }

  async deleteRoute(routeId: string) {
    return prisma.route.delete({
      where: { id: routeId },
    });
  }
}

export const routeRepository = new RouteRepository();
