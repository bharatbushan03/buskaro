/**
 * Route Service - Module Structure
 */

import { RouteRepository, routeRepository } from './route.repository';
import { AppError } from '../../middleware/error.middleware';
import { RouteStatus } from '@prisma/client';

export class RouteService {
  constructor(private repository: RouteRepository) {}

  async getRoutes(filters: {
    status?: RouteStatus;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
    const { routes, total } = await this.repository.getRoutes({
      ...filters,
      offset,
    });

    return {
      data: routes.map(r => ({
        id: r.id,
        name: r.name,
        routeNumber: r.routeNumber,
        description: r.description,
        startLocation: r.startLocation,
        endLocation: r.endLocation,
        totalDistance: r.totalDistance,
        estimatedDuration: r.estimatedDuration,
        status: r.status,
        stopCount: r.pickupPoints.length,
        busCount: r.buses.length,
        activeBuses: r.buses.filter(b => b.status === 'ACTIVE').length,
      })),
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        pages: Math.ceil(total / (filters.limit || 50)),
      },
    };
  }

  async getRouteDetails(routeId: string) {
    const route = await this.repository.getRouteById(routeId);
    if (!route) {
      throw new AppError('Route not found', 404);
    }
    return route;
  }

  async createRoute(data: any) {
    return this.repository.createRoute(data);
  }

  async updateRoute(routeId: string, data: any) {
    const route = await this.repository.updateRoute(routeId, data);
    if (!route) {
      throw new AppError('Route not found', 404);
    }
    return route;
  }

  async deleteRoute(routeId: string) {
    const route = await this.repository.deleteRoute(routeId);
    if (!route) {
      throw new AppError('Route not found', 404);
    }
    return route;
  }
}

export const routeService = new RouteService(routeRepository);
