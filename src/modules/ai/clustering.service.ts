/**
 * Clustering Service
 *
 * DBSCAN-based pickup clustering for intelligent grouping:
 * - Groups nearby pickup pins into clusters
 * - Reduces driver cognitive load
 * - Optimizes pickup sequence
 */

import { logger } from '../../utils/logger';

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  metadata?: any;
}

export interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  points: GeoPoint[];
  radius: number; // meters
  pointCount: number;
}

export interface DBSCANConfig {
  epsilon: number; // maximum distance between points in cluster (meters)
  minPoints: number; // minimum points to form a cluster
}

export class ClusteringService {
  private defaultConfig: DBSCANConfig = {
    epsilon: 500, // 500 meters
    minPoints: 2, // at least 2 pickups to form cluster
  };

  /**
   * Perform DBSCAN clustering on pickup points
   *
   * @param points - Array of pickup locations
   * @param config - DBSCAN configuration
   * @returns Array of clusters
   */
  clusterPickups(points: GeoPoint[], config?: Partial<DBSCANConfig>): Cluster[] {
    const finalConfig = { ...this.defaultConfig, ...config };

    if (points.length === 0) {
      return [];
    }

    if (points.length < finalConfig.minPoints) {
      // Not enough points for clustering, return as single cluster
      return [this.createSingleCluster(points)];
    }

    try {
      const clusters: Cluster[] = [];
      const visited = new Set<string>();
      const clustered = new Set<string>();

      for (const point of points) {
        if (visited.has(point.id)) continue;

        visited.add(point.id);

        // Find neighbors within epsilon
        const neighbors = this.getNeighbors(point, points, finalConfig.epsilon);

        if (neighbors.length >= finalConfig.minPoints) {
          // Start a new cluster
          const cluster = this.expandCluster(
            point,
            neighbors,
            points,
            visited,
            clustered,
            finalConfig
          );
          clusters.push(cluster);
        }
      }

      // Handle noise points (unclustered) - group them as individual clusters
      const noisePoints = points.filter((p) => !clustered.has(p.id));
      for (const point of noisePoints) {
        clusters.push(this.createSingleCluster([point]));
      }

      logger.info('Pickup clustering completed', {
        totalPoints: points.length,
        clustersFound: clusters.length,
        avgClusterSize:
          clusters.reduce((sum, c) => sum + c.pointCount, 0) / clusters.length,
      });

      return clusters.sort((a, b) => b.pointCount - a.pointCount);
    } catch (error) {
      logger.error('Clustering failed', { error });
      // Fallback: return all points as individual clusters
      return points.map((p) => this.createSingleCluster([p]));
    }
  }

  /**
   * Expand cluster from seed point (DBSCAN core logic)
   */
  private expandCluster(
    seedPoint: GeoPoint,
    neighbors: GeoPoint[],
    allPoints: GeoPoint[],
    visited: Set<string>,
    clustered: Set<string>,
    config: DBSCANConfig
  ): Cluster {
    const clusterPoints: GeoPoint[] = [seedPoint];
    clustered.add(seedPoint.id);

    let i = 0;
    while (i < neighbors.length) {
      const neighbor = neighbors[i];

      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);

        const neighborNeighbors = this.getNeighbors(
          neighbor,
          allPoints,
          config.epsilon
        );

        if (neighborNeighbors.length >= config.minPoints) {
          // Add all new neighbors to process
          for (const nn of neighborNeighbors) {
            if (!neighbors.find((n) => n.id === nn.id)) {
              neighbors.push(nn);
            }
          }
        }
      }

      if (!clustered.has(neighbor.id)) {
        clusterPoints.push(neighbor);
        clustered.add(neighbor.id);
      }

      i++;
    }

    return this.createCluster(clusterPoints);
  }

  /**
   * Get neighbors within epsilon distance
   */
  private getNeighbors(
    point: GeoPoint,
    points: GeoPoint[],
    epsilon: number
  ): GeoPoint[] {
    return points.filter((p) => {
      if (p.id === point.id) return false;
      const distance = this.haversineDistance(point.lat, point.lng, p.lat, p.lng);
      return distance <= epsilon;
    });
  }

  /**
   * Create a cluster from points
   */
  private createCluster(points: GeoPoint[]): Cluster {
    const center = this.calculateCentroid(points);
    const radius = this.calculateClusterRadius(points, center);

    return {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      center,
      points,
      radius,
      pointCount: points.length,
    };
  }

  /**
   * Create a single-point cluster
   */
  private createSingleCluster(points: GeoPoint[]): Cluster {
    return {
      id: `cluster_${points[0].id}`,
      center: { lat: points[0].lat, lng: points[0].lng },
      points,
      radius: 0,
      pointCount: points.length,
    };
  }

  /**
   * Calculate centroid of points
   */
  private calculateCentroid(points: GeoPoint[]): { lat: number; lng: number } {
    const sum = points.reduce(
      (acc, p) => ({
        lat: acc.lat + p.lat,
        lng: acc.lng + p.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / points.length,
      lng: sum.lng / points.length,
    };
  }

  /**
   * Calculate cluster radius (max distance from center)
   */
  private calculateClusterRadius(
    points: GeoPoint[],
    center: { lat: number; lng: number }
  ): number {
    return Math.max(
      ...points.map((p) => this.haversineDistance(center.lat, center.lng, p.lat, p.lng))
    );
  }

  /**
   * Haversine distance calculation (meters)
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get optimal cluster configuration based on area density
   */
  getAdaptiveConfig(pointCount: number, areaSizeKm: number): DBSCANConfig {
    const density = pointCount / areaSizeKm;

    if (density > 10) {
      // High density (urban)
      return { epsilon: 300, minPoints: 3 };
    } else if (density > 5) {
      // Medium density
      return { epsilon: 500, minPoints: 2 };
    } else {
      // Low density (rural)
      return { epsilon: 1000, minPoints: 2 };
    }
  }
}

export const clusteringService = new ClusteringService();
