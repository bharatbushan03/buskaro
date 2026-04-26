/**
 * AI Service
 *
 * Main orchestration layer for all AI features:
 * - Pickup clustering integration
 * - Route optimization
 * - ETA prediction
 * - Anti-spoof detection
 * - Real-time updates
 */

import { clusteringService, Cluster, GeoPoint } from './clustering.service';
import { etaService, ETAResult, ETAPredictionContext } from './eta.service';
import { routeOptimizationService, Stop, OptimizedRoute } from './routeOptimization.service';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';
import { DriverEvents, StudentEvents, getBusRoom } from '../../sockets/events';
import { auditLog } from '../../utils/audit';

export interface DriverPickupCluster {
  id: string;
  center: { lat: number; lng: number };
  pickupCount: number;
  radius: number;
  students: Array<{
    studentId: string;
    name: string;
    distance: number;
    expiryTime: string;
  }>;
  recommendedAction: 'pickup' | 'skip';
  etaMinutes: number;
}

export interface LocationUpdate {
  busId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
  heading?: number;
}

export interface SpoofCheckResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  flags: string[];
  reason?: string;
}

export class AIService {
  // Configuration
  private readonly MAX_REALISTIC_SPEED_KMH = 120;
  private readonly MAX_LOCATION_JUMP_KM = 5; // 5km in 5 seconds is unrealistic
  private readonly UPDATE_INTERVAL_MS = 5000;

  // State tracking for spoof detection
  private lastLocations: Map<
    string,
    { lat: number; lng: number; timestamp: number; speed: number }
  > = new Map();

  /**
   * Process pickup requests and return clustered view for driver
   */
  async clusterPickupsForDriver(
    pickups: Array<{
      id: string;
      studentId: string;
      studentName: string;
      lat: number;
      lng: number;
      expiresAt: Date;
    }>,
    busLocation: { lat: number; lng: number },
    driverId: string
  ): Promise<DriverPickupCluster[]> {
    if (pickups.length === 0) {
      return [];
    }

    try {
      // Convert to GeoPoints
      const points: GeoPoint[] = pickups.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        metadata: {
          studentId: p.studentId,
          studentName: p.studentName,
          expiresAt: p.expiresAt,
        },
      }));

      // Cluster pickups
      const clusters = clusteringService.clusterPickups(points, {
        epsilon: 400, // 400 meters
        minPoints: 1,
      });

      // Enhance clusters with ETA and recommendations
      const enhancedClusters: DriverPickupCluster[] = await Promise.all(
        clusters.map(async (cluster) => {
          const distanceKm = this.haversineDistance(
            busLocation.lat,
            busLocation.lng,
            cluster.center.lat,
            cluster.center.lng
          );

          const eta = etaService.calculateETA({
            distanceKm,
            currentSpeedKmh: undefined,
            stopsAhead: 0,
          });

          const students = cluster.points.map((p) => ({
            studentId: p.metadata.studentId,
            name: p.metadata.studentName,
            distance: this.haversineDistance(
              busLocation.lat,
              busLocation.lng,
              p.lat,
              p.lng
            ),
            expiryTime: p.metadata.expiresAt.toISOString(),
          }));

          // Sort by distance
          students.sort((a, b) => a.distance - b.distance);

          return {
            id: cluster.id,
            center: cluster.center,
            pickupCount: cluster.pointCount,
            radius: Math.round(cluster.radius),
            students,
            recommendedAction: cluster.pointCount >= 2 ? 'pickup' : 'skip',
            etaMinutes: eta.minutes,
          };
        })
      );

      // Sort by distance from bus
      enhancedClusters.sort((a, b) => {
        const distA = this.haversineDistance(
          busLocation.lat,
          busLocation.lng,
          a.center.lat,
          a.center.lng
        );
        const distB = this.haversineDistance(
          busLocation.lat,
          busLocation.lng,
          b.center.lat,
          b.center.lng
        );
        return distA - distB;
      });

      logger.info('Pickups clustered for driver', {
        driverId,
        totalPickups: pickups.length,
        clustersFound: enhancedClusters.length,
      });

      return enhancedClusters;
    } catch (error) {
      logger.error('Failed to cluster pickups', { error, driverId });
      // Return individual pickups as clusters
      return pickups.map((p) => ({
        id: `single_${p.id}`,
        center: { lat: p.lat, lng: p.lng },
        pickupCount: 1,
        radius: 0,
        students: [
          {
            studentId: p.studentId,
            name: p.studentName,
            distance: 0,
            expiryTime: p.expiresAt.toISOString(),
          },
        ],
        recommendedAction: 'pickup',
        etaMinutes: 0,
      }));
    }
  }

  /**
   * Optimize route for driver with current pickups
   */
  async optimizeDriverRoute(
    busLocation: { lat: number; lng: number },
    currentRouteStops: Stop[],
    newPickups: Stop[]
  ): Promise<OptimizedRoute> {
    try {
      // Combine existing stops with new pickups
      const allStops = [...currentRouteStops, ...newPickups];

      // Remove duplicates
      const uniqueStops = allStops.filter(
        (stop, index, self) => index === self.findIndex((s) => s.id === stop.id)
      );

      const optimized = routeOptimizationService.optimizeRoute(busLocation, uniqueStops);

      logger.info('Route optimized', {
        originalStops: allStops.length,
        optimizedStops: optimized.stops.length,
        improvement: `${optimized.improvementPercent}%`,
      });

      return optimized;
    } catch (error) {
      logger.error('Route optimization failed', { error });
      // Return unoptimized
      return {
        stops: [...currentRouteStops, ...newPickups],
        totalDistanceKm: 0,
        estimatedDurationMinutes: 0,
        originalDistanceKm: 0,
        improvementPercent: 0,
        geoJson: null,
      };
    }
  }

  /**
   * Calculate smart ETA for student
   */
  async calculateStudentETA(context: ETAPredictionContext): Promise<ETAResult> {
    return etaService.calculateRouteETA(context);
  }

  /**
   * Process bus location update and emit enhanced data
   */
  async processBusLocationUpdate(update: LocationUpdate): Promise<void> {
    const { busId, driverId, lat, lng, speed, timestamp } = update;

    // 1. Spoof detection
    const spoofCheck = this.detectSpoofing(busId, lat, lng, speed, timestamp);

    if (!spoofCheck.isValid) {
      logger.warn('Potential GPS spoofing detected', {
        busId,
        driverId,
        flags: spoofCheck.flags,
        reason: spoofCheck.reason,
      });

      auditLog('GPS_SPOOFING_DETECTED', driverId, {
        busId,
        flags: spoofCheck.flags,
        location: { lat, lng },
      });

      // Still process but flag as suspicious
    }

    // 2. Update last location
    this.lastLocations.set(busId, {
      lat,
      lng,
      timestamp: timestamp.getTime(),
      speed,
    });

    // 3. Emit location with confidence
    const room = getBusRoom(busId);
    io.to(room).emit(DriverEvents.LOCATION_UPDATE, {
      type: 'bus_location',
      data: {
        busId,
        lat,
        lng,
        speed,
        timestamp: timestamp.toISOString(),
        spoofCheck,
      },
    });

    logger.debug('Bus location processed', { busId, lat, lng, spoofCheck });
  }

  /**
   * Detect GPS spoofing attempts
   */
  private detectSpoofing(
    busId: string,
    lat: number,
    lng: number,
    speed: number,
    timestamp: Date
  ): SpoofCheckResult {
    const flags: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';

    const lastLocation = this.lastLocations.get(busId);

    if (!lastLocation) {
      return { isValid: true, confidence: 'medium', flags: ['first_location'] };
    }

    // Check 1: Unrealistic speed
    if (speed > this.MAX_REALISTIC_SPEED_KMH) {
      flags.push('unrealistic_speed');
      confidence = 'high';
    }

    // Check 2: Sudden large jump
    const timeDiffSeconds = (timestamp.getTime() - lastLocation.timestamp) / 1000;
    const distanceKm = this.haversineDistance(
      lastLocation.lat,
      lastLocation.lng,
      lat,
      lng
    );

    if (distanceKm > this.MAX_LOCATION_JUMP_KM && timeDiffSeconds < 10) {
      flags.push('sudden_large_jump');
      confidence = 'high';
    }

    // Check 3: Speed-distance mismatch
    if (speed > 0 && timeDiffSeconds > 0) {
      const expectedDistance = (speed / 3600) * timeDiffSeconds;
      if (Math.abs(distanceKm - expectedDistance) > 1) {
        // More than 1km difference
        flags.push('speed_distance_mismatch');
        confidence = confidence === 'high' ? 'high' : 'medium';
      }
    }

    // Check 4: Stationary but moving (mock check)
    if (speed === 0 && distanceKm > 0.1) {
      flags.push('stationary_but_moving');
      confidence = 'medium';
    }

    return {
      isValid: flags.length === 0,
      confidence,
      flags,
      reason: flags.length > 0 ? `Flags: ${flags.join(', ')}` : undefined,
    };
  }

  /**
   * Broadcast cluster update to driver
   */
  async broadcastClusterUpdate(
    driverId: string,
    busId: string,
    clusters: DriverPickupCluster[]
  ): Promise<void> {
    try {
      const room = getBusRoom(busId);

      io.to(room).emit(DriverEvents.PICKUP_CLUSTER_UPDATED, {
        type: 'pickup_clusters',
        data: {
          clusters,
          timestamp: new Date().toISOString(),
          totalPickups: clusters.reduce((sum, c) => sum + c.pickupCount, 0),
        },
      });

      logger.debug('Cluster update broadcast', { driverId, clusterCount: clusters.length });
    } catch (error) {
      logger.error('Failed to broadcast cluster update', { error, driverId });
    }
  }

  /**
   * Broadcast ETA update to student
   */
  async broadcastETAUpdate(
    studentId: string,
    eta: ETAResult,
    busId: string
  ): Promise<void> {
    try {
      io.to(`student:${studentId}`).emit(StudentEvents.ETA_UPDATE, {
        type: 'eta_update',
        data: {
          eta,
          busId,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug('ETA update broadcast', { studentId, eta: eta.minutes });
    } catch (error) {
      logger.error('Failed to broadcast ETA update', { error, studentId });
    }
  }

  /**
   * Clear cached data for bus (on trip end)
   */
  clearBusCache(busId: string): void {
    this.lastLocations.delete(busId);
    etaService.clearCache();
    logger.info('Bus cache cleared', { busId });
  }

  /**
   * Haversine distance calculation
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

export const aiService = new AIService();
