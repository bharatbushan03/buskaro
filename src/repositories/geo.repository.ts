/**
 * Geo Repository
 * 
 * Handles geospatial database queries using raw SQL with coordinate fields.
 * Provides methods for finding nearby buses, distance calculations, and location-based queries.
 */

import { PrismaClient, Bus, PickupPoint, LocationHistory } from '@prisma/client';
import {
  GeoPoint,
  calculateDistance,
  calculateBoundingBox,
} from '../utils/geo.utils';

const prisma = new PrismaClient();

export interface NearbyBusResult {
  bus: Bus;
  distance: number; // in kilometers
  estimatedArrivalMinutes: number;
}

export interface NearbyPickupPointResult {
  pickupPoint: PickupPoint;
  distance: number; // in kilometers
}

export class GeoRepository {
  /**
   * Find buses within a given radius of a location
   * Uses two-phase query: bounding box first, then precise distance
   */
  async findNearbyBuses(
    location: GeoPoint,
    radiusKm: number,
    options: {
      activeOnly?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<NearbyBusResult[]> {
    const { activeOnly = true, maxResults = 10 } = options;

    // Calculate bounding box for efficient initial filtering
    const bounds = calculateBoundingBox(location, radiusKm);

    // Query buses within bounding box
    const buses = await prisma.bus.findMany({
      where: {
        currentLat: {
          gte: bounds.minLat,
          lte: bounds.maxLat,
          not: null,
        },
        currentLng: {
          gte: bounds.minLng,
          lte: bounds.maxLng,
          not: null,
        },
        ...(activeOnly && { status: 'ACTIVE' }),
      },
      include: {
        driver: true,
      },
    });

    // Filter by precise distance and calculate arrival estimates
    const results: NearbyBusResult[] = buses
      .filter((bus) => bus.currentLat && bus.currentLng)
      .map((bus) => {
        const busLocation: GeoPoint = {
          latitude: bus.currentLat!,
          longitude: bus.currentLng!,
        };
        const distance = calculateDistance(location, busLocation);
        // Estimate arrival: distance / average speed (30 km/h for city)
        const estimatedArrivalMinutes = Math.ceil((distance / 30) * 60);

        return {
          bus,
          distance,
          estimatedArrivalMinutes,
        };
      })
      .filter((result) => result.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    return results;
  }

  /**
   * Find the nearest bus to a specific location
   */
  async findNearestBus(
    location: GeoPoint,
    options: { activeOnly?: boolean } = {}
  ): Promise<NearbyBusResult | null> {
    const results = await this.findNearbyBuses(location, 50, { ...options, maxResults: 1 });
    return results[0] || null;
  }

  /**
   * Find pickup points within radius of a location
   */
  async findNearbyPickupPoints(
    location: GeoPoint,
    radiusKm: number,
    options: {
      routeId?: string;
      maxResults?: number;
    } = {}
  ): Promise<NearbyPickupPointResult[]> {
    const { routeId, maxResults = 20 } = options;

    const bounds = calculateBoundingBox(location, radiusKm);

    const pickupPoints = await prisma.pickupPoint.findMany({
      where: {
        latitude: {
          gte: bounds.minLat,
          lte: bounds.maxLat,
        },
        longitude: {
          gte: bounds.minLng,
          lte: bounds.maxLng,
        },
        ...(routeId && { routeId }),
      },
      include: {
        route: true,
      },
    });

    const results = pickupPoints
      .map((point) => {
        const pointLocation: GeoPoint = {
          latitude: point.latitude,
          longitude: point.longitude,
        };
        return {
          pickupPoint: point,
          distance: calculateDistance(location, pointLocation),
        };
      })
      .filter((result) => result.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    return results;
  }

  /**
   * Get bus location history with distance from a reference point
   */
  async getBusLocationHistory(
    busId: string,
    options: {
      from?: Date;
      to?: Date;
      limit?: number;
      referencePoint?: GeoPoint;
    } = {}
  ): Promise<Array<LocationHistory & { distanceFromReference?: number }>> {
    const { from, to, limit = 100, referencePoint } = options;

    const locations = await prisma.locationHistory.findMany({
      where: {
        busId,
        ...(from && { recordedAt: { gte: from } }),
        ...(to && { recordedAt: { lte: to } }),
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    if (referencePoint) {
      return locations.map((loc) => ({
        ...loc,
        distanceFromReference: calculateDistance(referencePoint, {
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      }));
    }

    return locations;
  }

  /**
   * Get total distance traveled by a bus in a time period
   */
  async calculateBusDistanceTraveled(
    busId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    const locations = await prisma.locationHistory.findMany({
      where: {
        busId,
        recordedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const point1: GeoPoint = {
        latitude: locations[i - 1].latitude,
        longitude: locations[i - 1].longitude,
      };
      const point2: GeoPoint = {
        latitude: locations[i].latitude,
        longitude: locations[i].longitude,
      };
      totalDistance += calculateDistance(point1, point2);
    }

    return totalDistance;
  }

  /**
   * Find students near a specific location (for emergency or targeted notifications)
   */
  async findStudentsNearLocation(
    location: GeoPoint,
    radiusKm: number,
    options: {
      routeId?: string;
      maxResults?: number;
    } = {}
  ): Promise<Array<{ studentId: string; name: string; distance: number }>> {
    const { routeId, maxResults = 50 } = options;

    const bounds = calculateBoundingBox(location, radiusKm);

    // Query through pickup points (students are linked to pickup points)
    const pickupPoints = await prisma.pickupPoint.findMany({
      where: {
        latitude: {
          gte: bounds.minLat,
          lte: bounds.maxLat,
        },
        longitude: {
          gte: bounds.minLng,
          lte: bounds.maxLng,
        },
        ...(routeId && { routeId }),
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const results: Array<{ studentId: string; name: string; distance: number }> = [];

    for (const point of pickupPoints) {
      const pointLocation: GeoPoint = {
        latitude: point.latitude,
        longitude: point.longitude,
      };
      const distance = calculateDistance(location, pointLocation);

      if (distance <= radiusKm) {
        for (const student of point.students) {
          results.push({
            studentId: student.id,
            name: student.name,
            distance,
          });
        }
      }
    }

    // Remove duplicates and sort by distance
    const unique = Array.from(
      new Map(results.map((r) => [r.studentId, r])).values()
    );

    return unique.sort((a, b) => a.distance - b.distance).slice(0, maxResults);
  }

  /**
   * Update bus current location
   */
  async updateBusLocation(
    busId: string,
    location: GeoPoint,
    metadata?: {
      accuracy?: number;
      heading?: number;
      speed?: number;
      altitude?: number;
    }
  ): Promise<void> {
    await prisma.$transaction([
      // Update bus current location
      prisma.bus.update({
        where: { id: busId },
        data: {
          currentLat: location.latitude,
          currentLng: location.longitude,
          lastLocationAt: new Date(),
        },
      }),
      // Add to location history
      prisma.locationHistory.create({
        data: {
          busId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: metadata?.accuracy,
          heading: metadata?.heading,
          speed: metadata?.speed,
          altitude: metadata?.altitude,
          recordedAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * Get average speed of bus in time period
   */
  async getBusAverageSpeed(busId: string, from: Date, to: Date): Promise<number> {
    const locations = await prisma.locationHistory.findMany({
      where: {
        busId,
        recordedAt: {
          gte: from,
          lte: to,
        },
        speed: { not: null },
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (locations.length === 0) return 0;

    const totalSpeed = locations.reduce((sum, loc) => sum + (loc.speed || 0), 0);
    return totalSpeed / locations.length;
  }

  /**
   * Find buses on a specific route within radius
   */
  async findBusesOnRoute(
    routeId: string,
    location: GeoPoint,
    radiusKm: number
  ): Promise<NearbyBusResult[]> {
    const buses = await this.findNearbyBuses(location, radiusKm, {
      activeOnly: true,
    });

    // Filter by route - check currentRouteId
    return buses.filter((result) => result.bus.currentRouteId === routeId);
  }
}

export const geoRepository = new GeoRepository();
