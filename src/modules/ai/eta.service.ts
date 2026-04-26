/**
 * ETA Service
 *
 * Intelligent ETA prediction using multiple factors:
 * - Real-time distance and speed
 * - Number of stops ahead
 * - Traffic patterns (mock)
 * - Historical data consideration
 */

import { logger } from '../../utils/logger';

export interface ETAInput {
  distanceKm: number;
  currentSpeedKmh?: number;
  stopsAhead: number;
  stopDurationSeconds?: number;
  timeOfDay?: Date;
  dayOfWeek?: number;
  weatherFactor?: number; // 0.8-1.2 multiplier
}

export interface ETAResult {
  minutes: number;
  seconds: number;
  confidence: 'high' | 'medium' | 'low';
  factors: {
    baseTime: number;
    stopTime: number;
    trafficFactor: number;
    adjustedTime: number;
  };
  updatedAt: string;
}

export interface ETAPredictionContext {
  busId: string;
  routeId: string;
  studentStopId?: string;
  currentLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  stopsAhead: Array<{
    id: string;
    lat: number;
    lng: number;
    estimatedWaitSeconds: number;
  }>;
}

export class ETAService {
  // Constants for ETA calculation
  private readonly DEFAULT_SPEED_KMH = 25;
  private readonly MIN_SPEED_KMH = 5;
  private readonly MAX_SPEED_KMH = 60;
  private readonly DEFAULT_STOP_DURATION_SECONDS = 30;
  private readonly TRAFFIC_PEAK_MULTIPLIER = 1.3;
  private readonly TRAFFIC_OFFPEAK_MULTIPLIER = 1.0;
  private readonly LOW_CONFIDENCE_THRESHOLD = 5; // km

  // Cache for recent predictions
  private predictionCache: Map<string, { result: ETAResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 30000; // 30 seconds

  /**
   * Calculate intelligent ETA
   *
   * @param input - ETA calculation inputs
   * @returns ETA result with confidence and breakdown
   */
  calculateETA(input: ETAInput): ETAResult {
    const {
      distanceKm,
      currentSpeedKmh,
      stopsAhead,
      stopDurationSeconds,
      timeOfDay,
      weatherFactor = 1.0,
    } = input;

    try {
      // 1. Determine effective speed
      const effectiveSpeed = this.getEffectiveSpeed(currentSpeedKmh, distanceKm);

      // 2. Calculate base travel time
      const baseTimeMinutes = distanceKm / effectiveSpeed * 60;

      // 3. Calculate stop time
      const avgStopDuration = stopDurationSeconds || this.DEFAULT_STOP_DURATION_SECONDS;
      const stopTimeMinutes = (stopsAhead * avgStopDuration) / 60;

      // 4. Apply traffic factor
      const trafficFactor = this.getTrafficFactor(timeOfDay);
      const trafficAdjustedTime = baseTimeMinutes * trafficFactor;

      // 5. Apply weather factor
      const weatherAdjustedTime = trafficAdjustedTime * weatherFactor;

      // 6. Total time
      const totalMinutes = weatherAdjustedTime + stopTimeMinutes;

      // 7. Round appropriately
      const roundedMinutes = Math.max(1, Math.ceil(totalMinutes));

      // 8. Determine confidence
      const confidence = this.determineConfidence(
        distanceKm,
        currentSpeedKmh,
        stopsAhead
      );

      const result: ETAResult = {
        minutes: roundedMinutes,
        seconds: Math.round(totalMinutes * 60),
        confidence,
        factors: {
          baseTime: Math.round(baseTimeMinutes * 10) / 10,
          stopTime: Math.round(stopTimeMinutes * 10) / 10,
          trafficFactor: Math.round(trafficFactor * 100) / 100,
          adjustedTime: Math.round(weatherAdjustedTime * 10) / 10,
        },
        updatedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('ETA calculation failed', { error, input });
      // Fallback to simple calculation
      return this.fallbackETA(distanceKm);
    }
  }

  /**
   * Calculate ETA with full context (route-aware)
   */
  calculateRouteETA(context: ETAPredictionContext): ETAResult {
    const cacheKey = `${context.busId}_${context.studentStopId}_${Math.floor(Date.now() / 1000 / 30)}`; // Cache for 30s

    // Check cache
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result;
    }

    // Calculate distance to destination
    const distanceKm = this.haversineDistance(
      context.currentLocation.lat,
      context.currentLocation.lng,
      context.destinationLocation.lat,
      context.destinationLocation.lng
    );

    // Get current speed from recent location history (mock for now)
    const currentSpeedKmh = undefined; // Could be fetched from Redis/Bus tracking

    // Calculate total stop time
    const stopsAhead = context.stopsAhead.length;
    const totalStopTimeSeconds = context.stopsAhead.reduce(
      (sum, stop) => sum + (stop.estimatedWaitSeconds || this.DEFAULT_STOP_DURATION_SECONDS),
      0
    );

    // Get time-based traffic factor
    const timeOfDay = new Date();

    const result = this.calculateETA({
      distanceKm,
      currentSpeedKmh,
      stopsAhead,
      stopDurationSeconds: totalStopTimeSeconds / stopsAhead || this.DEFAULT_STOP_DURATION_SECONDS,
      timeOfDay,
      weatherFactor: 1.0, // Could integrate weather API
    });

    // Cache result
    this.predictionCache.set(cacheKey, { result, timestamp: Date.now() });

    // Clean old cache entries periodically
    if (this.predictionCache.size > 1000) {
      this.cleanCache();
    }

    return result;
  }

  /**
   * Update ETA based on real-time location update
   */
  updateETAOnLocation(
    busId: string,
    previousETA: ETAResult,
    newDistanceKm: number,
    currentSpeedKmh?: number
  ): ETAResult {
    // If significant distance change, recalculate
    const distanceDiff = Math.abs(
      (previousETA.factors.adjustedTime / 60) * this.DEFAULT_SPEED_KMH - newDistanceKm
    );

    if (distanceDiff > 0.5) {
      // More than 500m difference, recalculate
      return this.calculateETA({
        distanceKm: newDistanceKm,
        currentSpeedKmh,
        stopsAhead: Math.ceil(previousETA.factors.stopTime / (this.DEFAULT_STOP_DURATION_SECONDS / 60)),
      });
    }

    // Minor update to existing ETA
    const timeElapsed = (Date.now() - new Date(previousETA.updatedAt).getTime()) / 1000 / 60; // minutes
    const remainingMinutes = Math.max(1, previousETA.minutes - timeElapsed);

    return {
      ...previousETA,
      minutes: Math.ceil(remainingMinutes),
      seconds: Math.round(remainingMinutes * 60),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get ETA for multiple stops (batch prediction)
   */
  calculateETABatch(
    busLocation: { lat: number; lng: number },
    stops: Array<{ id: string; lat: number; lng: number; sequenceOrder: number }>,
    currentSpeedKmh?: number
  ): Array<{ stopId: string; etaMinutes: number; sequenceOrder: number }> {
    const results: Array<{ stopId: string; etaMinutes: number; sequenceOrder: number }> = [];
    let cumulativeMinutes = 0;
    let lastLocation = busLocation;

    for (const stop of stops.sort((a, b) => a.sequenceOrder - b.sequenceOrder)) {
      const distanceKm = this.haversineDistance(
        lastLocation.lat,
        lastLocation.lng,
        stop.lat,
        stop.lng
      );

      const eta = this.calculateETA({
        distanceKm,
        currentSpeedKmh,
        stopsAhead: 1,
      });

      cumulativeMinutes += eta.minutes;

      results.push({
        stopId: stop.id,
        etaMinutes: cumulativeMinutes,
        sequenceOrder: stop.sequenceOrder,
      });

      lastLocation = { lat: stop.lat, lng: stop.lng };
    }

    return results;
  }

  /**
   * Determine effective speed based on available data
   */
  private getEffectiveSpeed(currentSpeedKmh: number | undefined, distanceKm: number): number {
    if (!currentSpeedKmh || currentSpeedKmh < this.MIN_SPEED_KMH) {
      // No recent speed data, use default
      return this.DEFAULT_SPEED_KMH;
    }

    if (currentSpeedKmh > this.MAX_SPEED_KMH) {
      // Cap at max realistic speed
      return this.MAX_SPEED_KMH;
    }

    // For short distances, average with default speed for stability
    if (distanceKm < 1) {
      return (currentSpeedKmh + this.DEFAULT_SPEED_KMH) / 2;
    }

    return currentSpeedKmh;
  }

  /**
   * Get traffic factor based on time of day
   */
  private getTrafficFactor(timeOfDay?: Date): number {
    if (!timeOfDay) {
      return this.TRAFFIC_OFFPEAK_MULTIPLIER;
    }

    const hour = timeOfDay.getHours();
    const day = timeOfDay.getDay();

    // Weekend
    if (day === 0 || day === 6) {
      return this.TRAFFIC_OFFPEAK_MULTIPLIER;
    }

    // Peak hours: 8-10 AM, 5-7 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      return this.TRAFFIC_PEAK_MULTIPLIER;
    }

    return this.TRAFFIC_OFFPEAK_MULTIPLIER;
  }

  /**
   * Determine confidence level
   */
  private determineConfidence(
    distanceKm: number,
    currentSpeedKmh: number | undefined,
    stopsAhead: number
  ): 'high' | 'medium' | 'low' {
    // High confidence: short distance with speed data
    if (distanceKm < this.LOW_CONFIDENCE_THRESHOLD && currentSpeedKmh && currentSpeedKmh > 0) {
      return 'high';
    }

    // Medium confidence: reasonable distance or known speed
    if (distanceKm < 10 || (currentSpeedKmh && currentSpeedKmh > 0)) {
      return 'medium';
    }

    // Low confidence: long distance with no speed data
    return 'low';
  }

  /**
   * Fallback ETA calculation
   */
  private fallbackETA(distanceKm: number): ETAResult {
    const minutes = Math.ceil((distanceKm / this.DEFAULT_SPEED_KMH) * 60);

    return {
      minutes: Math.max(1, minutes),
      seconds: minutes * 60,
      confidence: 'low',
      factors: {
        baseTime: minutes,
        stopTime: 0,
        trafficFactor: 1,
        adjustedTime: minutes,
      },
      updatedAt: new Date().toISOString(),
    };
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

  /**
   * Clean old cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.predictionCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.predictionCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached predictions (for testing or route changes)
   */
  clearCache(): void {
    this.predictionCache.clear();
    logger.info('ETA prediction cache cleared');
  }
}

export const etaService = new ETAService();
