/**
 * Geospatial Utilities
 * 
 * Provides distance calculations and spatial queries without PostGIS.
 * Uses Haversine formula for accurate Earth-surface distances.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

// Earth's radius in meters
const EARTH_RADIUS_M = 6371000;

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLngRad = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate distance in meters
 */
export function calculateDistanceMeters(point1: GeoPoint, point2: GeoPoint): number {
  return calculateDistance(point1, point2) * 1000;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate bounding box for a given point and radius
 * Useful for efficient database queries (find points within box first, then precise distance)
 */
export function calculateBoundingBox(
  center: GeoPoint,
  radiusKm: number
): GeoBounds {
  // Approximate degrees per km at equator
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - deltaLat,
    maxLat: center.latitude + deltaLat,
    minLng: center.longitude - deltaLng,
    maxLng: center.longitude + deltaLng,
  };
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBounds(point: GeoPoint, bounds: GeoBounds): boolean {
  return (
    point.latitude >= bounds.minLat &&
    point.latitude <= bounds.maxLat &&
    point.longitude >= bounds.minLng &&
    point.longitude <= bounds.maxLng
  );
}

/**
 * Check if a point is within radius of another point
 */
export function isWithinRadius(
  point: GeoPoint,
  center: GeoPoint,
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

/**
 * Find nearest point from an array of points
 */
export function findNearestPoint(
  target: GeoPoint,
  points: Array<GeoPoint & { id: string }>
): { point: GeoPoint & { id: string }; distance: number } | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let minDistance = calculateDistance(target, points[0]);

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(target, points[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = points[i];
    }
  }

  return { point: nearest, distance: minDistance };
}

/**
 * Sort points by distance from a target point
 */
export function sortByDistance(
  target: GeoPoint,
  points: Array<GeoPoint & { id: string }>
): Array<{ point: GeoPoint & { id: string }; distance: number }> {
  return points
    .map((point) => ({
      point,
      distance: calculateDistance(target, point),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter points within a specific radius
 */
export function filterWithinRadius(
  center: GeoPoint,
  points: Array<GeoPoint & { id: string }>,
  radiusKm: number
): Array<{ point: GeoPoint & { id: string }; distance: number }> {
  return points
    .map((point) => ({
      point,
      distance: calculateDistance(center, point),
    }))
    .filter((item) => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Estimate travel time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmh Average speed in km/h (default: 30 for city driving)
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(
  distanceKm: number,
  averageSpeedKmh: number = 30
): number {
  const timeHours = distanceKm / averageSpeedKmh;
  return Math.ceil(timeHours * 60); // Convert to minutes, round up
}

/**
 * Create a GeoJSON Point object
 */
export function createGeoJSONPoint(point: GeoPoint): {
  type: 'Point';
  coordinates: [number, number];
} {
  return {
    type: 'Point',
    coordinates: [point.longitude, point.latitude],
  };
}

/**
 * Create a GeoJSON LineString from array of points
 */
export function createGeoJSONLineString(
  points: GeoPoint[]
): {
  type: 'LineString';
  coordinates: Array<[number, number]>;
} {
  return {
    type: 'LineString',
    coordinates: points.map((p) => [p.longitude, p.latitude]),
  };
}

/**
 * Parse GeoJSON Point to GeoPoint
 */
export function parseGeoJSONPoint(geojson: {
  type: 'Point';
  coordinates: [number, number];
}): GeoPoint {
  return {
    longitude: geojson.coordinates[0],
    latitude: geojson.coordinates[1],
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  point: GeoPoint,
  decimals: number = 6
): string {
  return `${point.latitude.toFixed(decimals)}, ${point.longitude.toFixed(
    decimals
  )}`;
}

/**
 * Validate if coordinates are valid
 */
export function isValidCoordinates(point: GeoPoint): boolean {
  return (
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

/**
 * Calculate bearing (direction) from point1 to point2
 * Returns bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(point1: GeoPoint, point2: GeoPoint): number {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLngRad = toRadians(point2.longitude - point1.longitude);

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Get cardinal direction from bearing
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate midpoint between two points
 */
export function calculateMidpoint(point1: GeoPoint, point2: GeoPoint): GeoPoint {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLngRad = toRadians(point2.longitude - point1.longitude);

  const Bx = Math.cos(lat2Rad) * Math.cos(deltaLngRad);
  const By = Math.cos(lat2Rad) * Math.sin(deltaLngRad);

  const midLatRad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
  );
  const midLngRad =
    toRadians(point1.longitude) + Math.atan2(By, Math.cos(lat1Rad) + Bx);

  return {
    latitude: toDegrees(midLatRad),
    longitude: toDegrees(midLngRad),
  };
}

/**
 * Decode polyline (Google Maps format) to GeoPoints
 * Useful for route paths from Google Maps API
 */
export function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;

    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;

    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}
