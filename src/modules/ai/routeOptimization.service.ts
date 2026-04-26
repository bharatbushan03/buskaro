/**
 * Route Optimization Service
 *
 * Intelligent route optimization for pickups:
 * - Nearest neighbor algorithm for initial optimization
 * - 2-opt improvement for better routes
 * - Dynamic re-routing based on new pickups
 */

import { logger } from '../../utils/logger';

export interface Stop {
  id: string;
  lat: number;
  lng: number;
  type: 'pickup_point' | 'pickup_request';
  priority?: number; // 1-10, higher = more important
  timeWindow?: {
    earliest: string; // HH:mm
    latest: string; // HH:mm
  };
  estimatedWaitSeconds?: number;
  metadata?: any;
}

export interface OptimizedRoute {
  stops: Stop[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  originalDistanceKm: number;
  improvementPercent: number;
  geoJson: any;
}

export class RouteOptimizationService {
  /**
   * Optimize route using nearest neighbor + 2-opt improvement
   *
   * @param startLocation - Starting point (bus current location)
   * @param stops - Array of stops to visit
   * @returns Optimized route
   */
  optimizeRoute(
    startLocation: { lat: number; lng: number },
    stops: Stop[]
  ): OptimizedRoute {
    if (stops.length === 0) {
      return {
        stops: [],
        totalDistanceKm: 0,
        estimatedDurationMinutes: 0,
        originalDistanceKm: 0,
        improvementPercent: 0,
        geoJson: this.generateGeoJson([startLocation]),
      };
    }

    if (stops.length === 1) {
      const distance = this.haversineDistance(
        startLocation.lat,
        startLocation.lng,
        stops[0].lat,
        stops[0].lng
      );

      return {
        stops,
        totalDistanceKm: distance,
        estimatedDurationMinutes: Math.ceil((distance / 25) * 60) + 1,
        originalDistanceKm: distance,
        improvementPercent: 0,
        geoJson: this.generateGeoJson([startLocation, stops[0]]),
      };
    }

    try {
      // Step 1: Nearest neighbor construction
      const nnRoute = this.nearestNeighbor(startLocation, stops);

      // Step 2: 2-opt improvement
      const optimizedStops = this.twoOpt(nnRoute);

      // Calculate metrics
      const originalDistance = this.calculateRouteDistance([
        startLocation,
        ...stops,
      ]);
      const optimizedDistance = this.calculateRouteDistance([
        startLocation,
        ...optimizedStops,
      ]);

      const improvementPercent =
        ((originalDistance - optimizedDistance) / originalDistance) * 100;

      // Generate GeoJSON path
      const geoJson = this.generateGeoJson([startLocation, ...optimizedStops]);

      return {
        stops: optimizedStops,
        totalDistanceKm: Math.round(optimizedDistance * 100) / 100,
        estimatedDurationMinutes: this.estimateDuration(optimizedDistance, optimizedStops.length),
        originalDistanceKm: Math.round(originalDistance * 100) / 100,
        improvementPercent: Math.round(improvementPercent * 100) / 100,
        geoJson,
      };
    } catch (error) {
      logger.error('Route optimization failed', { error });
      // Return original order
      return {
        stops,
        totalDistanceKm: this.calculateRouteDistance([startLocation, ...stops]),
        estimatedDurationMinutes: this.estimateDuration(
          this.calculateRouteDistance([startLocation, ...stops]),
          stops.length
        ),
        originalDistanceKm: this.calculateRouteDistance([startLocation, ...stops]),
        improvementPercent: 0,
        geoJson: this.generateGeoJson([startLocation, ...stops]),
      };
    }
  }

  /**
   * Dynamic re-optimization when new pickups are added
   */
  addPickupToRoute(
    currentRoute: Stop[],
    currentLocation: { lat: number; lng: number },
    newPickup: Stop
  ): OptimizedRoute {
    // Insert new pickup at optimal position
    const bestPosition = this.findBestInsertionPoint(currentRoute, currentLocation, newPickup);

    const newRoute = [...currentRoute];
    newRoute.splice(bestPosition.index, 0, newPickup);

    // Re-optimize with 2-opt
    const optimizedStops = this.twoOpt(newRoute);

    const totalDistance = this.calculateRouteDistance([currentLocation, ...optimizedStops]);

    return {
      stops: optimizedStops,
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      estimatedDurationMinutes: this.estimateDuration(totalDistance, optimizedStops.length),
      originalDistanceKm: totalDistance,
      improvementPercent: 0,
      geoJson: this.generateGeoJson([currentLocation, ...optimizedStops]),
    };
  }

  /**
   * Nearest neighbor algorithm for initial route construction
   */
  private nearestNeighbor(
    start: { lat: number; lng: number },
    stops: Stop[]
  ): Stop[] {
    const unvisited = [...stops];
    const route: Stop[] = [];
    let currentLocation = start;

    while (unvisited.length > 0) {
      // Find nearest unvisited stop
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const distance = this.haversineDistance(
          currentLocation.lat,
          currentLocation.lng,
          unvisited[i].lat,
          unvisited[i].lng
        );

        // Consider priority (higher priority = closer in effective distance)
        const effectiveDistance = distance / (unvisited[i].priority || 1);

        if (effectiveDistance < minDistance) {
          minDistance = effectiveDistance;
          nearestIndex = i;
        }
      }

      const nextStop = unvisited.splice(nearestIndex, 1)[0];
      route.push(nextStop);
      currentLocation = { lat: nextStop.lat, lng: nextStop.lng };
    }

    return route;
  }

  /**
   * 2-opt improvement algorithm
   * Iteratively improves route by swapping two edges
   */
  private twoOpt(stops: Stop[]): Stop[] {
    let improved = true;
    let route = [...stops];

    while (improved) {
      improved = false;

      for (let i = 0; i < route.length - 1; i++) {
        for (let j = i + 2; j < route.length; j++) {
          // Calculate current distance
          const currentDist =
            this.pointDistance(route[i], route[i + 1]) +
            this.pointDistance(route[j - 1], route[j]);

          // Calculate distance if we swap
          const newDist =
            this.pointDistance(route[i], route[j - 1]) +
            this.pointDistance(route[i + 1], route[j]);

          // If improvement, swap
          if (newDist < currentDist) {
            // Reverse the segment between i+1 and j-1
            const segment = route.slice(i + 1, j).reverse();
            route = [...route.slice(0, i + 1), ...segment, ...route.slice(j)];
            improved = true;
          }
        }
      }
    }

    return route;
  }

  /**
   * Find best position to insert new pickup
   */
  private findBestInsertionPoint(
    route: Stop[],
    currentLocation: { lat: number; lng: number },
    newStop: Stop
  ): { index: number; addedDistance: number } {
    let bestIndex = 0;
    let minAddedDistance = Infinity;

    for (let i = 0; i <= route.length; i++) {
      const prevLocation =
        i === 0 ? currentLocation : { lat: route[i - 1].lat, lng: route[i - 1].lng };

      const nextLocation =
        i < route.length ? { lat: route[i].lat, lng: route[i].lng } : null;

      const distToNew = this.haversineDistance(
        prevLocation.lat,
        prevLocation.lng,
        newStop.lat,
        newStop.lng
      );

      let addedDistance = distToNew;

      if (nextLocation) {
        const distNewToNext = this.haversineDistance(
          newStop.lat,
          newStop.lng,
          nextLocation.lat,
          nextLocation.lng
        );
        const distPrevToNext = this.haversineDistance(
          prevLocation.lat,
          prevLocation.lng,
          nextLocation.lat,
          nextLocation.lng
        );

        addedDistance = distToNew + distNewToNext - distPrevToNext;
      }

      if (addedDistance < minAddedDistance) {
        minAddedDistance = addedDistance;
        bestIndex = i;
      }
    }

    return { index: bestIndex, addedDistance: minAddedDistance };
  }

  /**
   * Calculate distance between two points
   */
  private pointDistance(a: Stop, b: Stop): number {
    return this.haversineDistance(a.lat, a.lng, b.lat, b.lng);
  }

  /**
   * Calculate total route distance
   */
  private calculateRouteDistance(points: Array<{ lat: number; lng: number }>): number {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += this.haversineDistance(
        points[i].lat,
        points[i].lng,
        points[i + 1].lat,
        points[i + 1].lng
      );
    }
    return total;
  }

  /**
   * Estimate duration based on distance and stops
   */
  private estimateDuration(distanceKm: number, stopCount: number): number {
    const travelTime = (distanceKm / 25) * 60; // 25 km/h avg
    const stopTime = stopCount * 0.5; // 30 seconds per stop
    return Math.ceil(travelTime + stopTime);
  }

  /**
   * Generate GeoJSON LineString for the route
   */
  private generateGeoJson(points: Array<{ lat: number; lng: number }>): any {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points.map((p) => [p.lng, p.lat]),
      },
      properties: {
        distance: this.calculateRouteDistance(points),
        stopCount: points.length - 1,
      },
    };
  }

  /**
   * Haversine distance calculation (km)
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const routeOptimizationService = new RouteOptimizationService();
