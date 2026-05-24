/**
 * Bus Service - Module Structure
 */

import { BusRepository, busRepository } from './bus.repository';
import { AppError } from '../../middleware/error.middleware';
import { BusStatus } from '@prisma/client';

export class BusService {
  constructor(private repository: BusRepository) {}

  async getBuses(filters: {
    status?: BusStatus;
    routeId?: string;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
    const { buses, total } = await this.repository.getBuses({
      ...filters,
      offset,
    });

    return {
      data: buses.map(b => ({
        id: b.id,
        registrationNumber: b.registrationNumber,
        model: b.model,
        manufacturer: b.manufacturer,
        year: b.year,
        capacity: b.capacity,
        status: b.status,
        currentLat: b.currentLat,
        currentLng: b.currentLng,
        lastLocationAt: b.lastLocationAt,
        driver: b.driver ? { id: b.driver.id, name: b.driver.name, phone: b.driver.phone } : null,
        route: b.route ? { id: b.route.id, name: b.route.name } : null,
        studentCount: b.students?.length || 0,
      })),
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        pages: Math.ceil(total / (filters.limit || 50)),
      },
    };
  }

  async getBusDetails(busId: string) {
    const bus = await this.repository.getBusById(busId);
    if (!bus) {
      throw new AppError('Bus not found', 404);
    }
    return bus;
  }

  async createBus(data: any) {
    return this.repository.createBus(data);
  }

  async updateBus(busId: string, data: any) {
    const bus = await this.repository.updateBus(busId, data);
    if (!bus) {
      throw new AppError('Bus not found', 404);
    }
    return bus;
  }
}

export const busService = new BusService(busRepository);
