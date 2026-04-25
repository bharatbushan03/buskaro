/**
 * Student Service
 * 
 * Business logic for student operations:
 * - Dashboard data aggregation
 * - ETA calculation
 * - Bus tracking
 * - Pickup management
 */

import { studentRepository } from './student.repository';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { calculateDistance, calculateBearing } from '../../utils/geo.utils';

export interface DashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rollNumber: string;
    department: string;
    semester: number;
    parentName?: string;
    parentPhone?: string;
  };
  bus: {
    id: string;
    registrationNumber: string;
    model: string;
    capacity: number;
    status: string;
    driver?: {
      id: string;
      name: string;
      phone?: string;
    };
  } | null;
  route: {
    id: string;
    name: string;
    routeNumber: string;
    totalDistance: number;
    estimatedDuration: number;
    stops: Array<{
      id: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      sequenceOrder: number;
      arrivalTime: string;
    }>;
  } | null;
  pickupPoint: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    arrivalTime: string;
  } | null;
  busLocation: {
    lat: number;
    lng: number;
    lastUpdated: Date;
    speed?: number;
    heading?: number;
  } | null;
  eta: {
    minutes: number;
    distanceKm: number;
    status: 'calculating' | 'available' | 'unavailable';
  } | null;
  activePickup: {
    id: string;
    status: string;
    lat: number;
    lng: number;
    requestedAt: Date;
    expiresAt: Date;
    driver?: {
      id: string;
      name: string;
      phone?: string;
    };
    bus?: {
      id: string;
      registrationNumber: string;
    };
  } | null;
  stats: {
    attendance: {
      rate: number;
      present: number;
      total: number;
    };
    payments: {
      paidAmount: number;
      pendingAmount: number;
      pendingCount: number;
    };
  };
}

export interface BusTrackingData {
  busId: string;
  location: {
    lat: number;
    lng: number;
    lastUpdated: Date;
  };
  speed?: number;
  heading?: number;
  status: string;
  driver?: {
    id: string;
    name: string;
  };
}

export class StudentService {
  private readonly AVERAGE_SPEED_KMH = 25; // Conservative city bus speed
  private readonly MAX_ETA_MINUTES = 120; // Cap ETA at 2 hours

  /**
   * Get comprehensive dashboard data
   */
  async getDashboard(studentId: string): Promise<DashboardData> {
    const studentData = await studentRepository.getStudentWithAssignments(studentId);

    if (!studentData) {
      throw new AppError('Student not found', 404);
    }

    // Parallel fetch for related data
    const [activePickup, attendanceData, paymentData] = await Promise.all([
      studentRepository.getActivePickup(studentId),
      studentRepository.getAttendanceSummary(studentId),
      studentRepository.getPaymentSummary(studentId),
    ]);

    // Calculate ETA if bus location available
    let eta: DashboardData['eta'] = null;
    let busLocation: DashboardData['busLocation'] = null;

    if (studentData.bus?.currentLat && studentData.bus?.currentLng) {
      busLocation = {
        lat: studentData.bus.currentLat,
        lng: studentData.bus.currentLng,
        lastUpdated: studentData.bus.lastLocationAt || new Date(),
      };

      // Get speed from recent history if available
      const recentHistory = await studentRepository.getBusLocationHistory(
        studentData.bus.id,
        1
      );
      if (recentHistory.length > 0 && recentHistory[0].speed) {
        busLocation.speed = recentHistory[0].speed;
        busLocation.heading = recentHistory[0].heading || undefined;
      }

      // Calculate ETA to student's pickup point
      if (studentData.pickupPoint) {
        eta = this.calculateETA(
          studentData.bus.currentLat,
          studentData.bus.currentLng,
          studentData.pickupPoint.latitude,
          studentData.pickupPoint.longitude,
          busLocation.speed
        );
      }
    }

    return {
      student: {
        id: studentData.id,
        name: studentData.name,
        email: studentData.user.email,
        phone: studentData.user.phone || undefined,
        rollNumber: studentData.rollNumber,
        department: studentData.department,
        semester: studentData.semester,
        parentName: studentData.parentName || undefined,
        parentPhone: studentData.parentPhone || undefined,
      },
      bus: studentData.bus ? {
        id: studentData.bus.id,
        registrationNumber: studentData.bus.registrationNumber,
        model: studentData.bus.model,
        capacity: studentData.bus.capacity,
        status: studentData.bus.status,
        driver: studentData.bus.driver ? {
          id: studentData.bus.driver.id,
          name: studentData.bus.driver.name,
          phone: studentData.bus.driver.phone || undefined,
        } : undefined,
      } : null,
      route: studentData.route ? {
        id: studentData.route.id,
        name: studentData.route.name,
        routeNumber: studentData.route.routeNumber,
        totalDistance: studentData.route.totalDistance,
        estimatedDuration: studentData.route.estimatedDuration,
        stops: studentData.route.pickupPoints.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          lat: p.latitude,
          lng: p.longitude,
          sequenceOrder: p.sequenceOrder,
          arrivalTime: p.arrivalTime,
        })),
      } : null,
      pickupPoint: studentData.pickupPoint ? {
        id: studentData.pickupPoint.id,
        name: studentData.pickupPoint.name,
        address: studentData.pickupPoint.address,
        lat: studentData.pickupPoint.latitude,
        lng: studentData.pickupPoint.longitude,
        arrivalTime: studentData.pickupPoint.arrivalTime,
      } : null,
      busLocation,
      eta,
      activePickup: activePickup ? {
        id: activePickup.id,
        status: activePickup.status,
        lat: activePickup.latitude,
        lng: activePickup.longitude,
        requestedAt: activePickup.requestedAt,
        expiresAt: activePickup.expiresAt,
        driver: activePickup.driver ? {
          id: activePickup.driver.id,
          name: activePickup.driver.name,
          phone: activePickup.driver.phone || undefined,
        } : undefined,
        bus: activePickup.bus ? {
          id: activePickup.bus.id,
          registrationNumber: activePickup.bus.registrationNumber,
        } : undefined,
      } : null,
      stats: {
        attendance: {
          rate: attendanceData.summary.attendanceRate,
          present: attendanceData.summary.present,
          total: attendanceData.summary.total,
        },
        payments: {
          paidAmount: paymentData.summary.paidAmount,
          pendingAmount: paymentData.summary.pendingAmount,
          pendingCount: paymentData.summary.pending,
        },
      },
    };
  }

  /**
   * Get real-time bus tracking data
   */
  async trackBus(studentId: string): Promise<BusTrackingData> {
    const studentData = await studentRepository.getStudentWithAssignments(studentId);

    if (!studentData) {
      throw new AppError('Student not found', 404);
    }

    if (!studentData.bus) {
      throw new AppError('No bus assigned', 404);
    }

    const bus = studentData.bus;

    if (!bus.currentLat || !bus.currentLng) {
      throw new AppError('Bus location not available', 503);
    }

    // Get recent history for speed/heading
    const recentHistory = await studentRepository.getBusLocationHistory(bus.id, 2);

    let speed: number | undefined;
    let heading: number | undefined;

    if (recentHistory.length >= 2) {
      const [latest, previous] = recentHistory;
      speed = latest.speed || undefined;
      heading = latest.heading || calculateBearing(
        previous.latitude,
        previous.longitude,
        latest.latitude,
        latest.longitude
      );
    }

    return {
      busId: bus.id,
      location: {
        lat: bus.currentLat,
        lng: bus.currentLng,
        lastUpdated: bus.lastLocationAt || new Date(),
      },
      speed,
      heading,
      status: bus.status,
      driver: bus.driver ? {
        id: bus.driver.id,
        name: bus.driver.name,
      } : undefined,
    };
  }

  /**
   * Get route navigation data
   */
  async getRoute(studentId: string) {
    const studentData = await studentRepository.getStudentWithAssignments(studentId);

    if (!studentData) {
      throw new AppError('Student not found', 404);
    }

    if (!studentData.route) {
      throw new AppError('No route assigned', 404);
    }

    const route = await studentRepository.getRouteWithStops(studentData.route.id);

    if (!route) {
      throw new AppError('Route not found', 404);
    }

    // Build GeoJSON path if available
    let pathGeoJson = null;
    if (route.pathGeoJson) {
      const pathData = route.pathGeoJson as any;
      pathGeoJson = {
        type: 'Feature',
        geometry: pathData.geometry || pathData,
        properties: {},
      };
    }

    return {
      route: {
        id: route.id,
        name: route.name,
        routeNumber: route.routeNumber,
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
      },
      path: pathGeoJson,
      stops: route.pickupPoints.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.latitude,
        lng: p.longitude,
        sequenceOrder: p.sequenceOrder,
        arrivalTime: p.arrivalTime,
        landmark: p.landmark,
        estimatedWaitMinutes: p.estimatedWaitMinutes,
        isMyStop: studentData.pickupPointId === p.id,
      })),
      activeBuses: route.buses.map(b => ({
        id: b.id,
        registrationNumber: b.registrationNumber,
        location: b.currentLat && b.currentLng ? {
          lat: b.currentLat,
          lng: b.currentLng,
        } : null,
        status: b.status,
      })),
    };
  }

  /**
   * Get attendance summary
   */
  async getAttendance(studentId: string) {
    return studentRepository.getAttendanceSummary(studentId);
  }

  /**
   * Get payment summary
   */
  async getPayments(studentId: string) {
    return studentRepository.getPaymentSummary(studentId);
  }

  /**
   * Calculate ETA based on distance and speed
   * 
   * PLACEHOLDER: Simple distance/speed calculation
   * TODO: Replace with AI-based prediction
   */
  private calculateETA(
    busLat: number,
    busLng: number,
    stopLat: number,
    stopLng: number,
    currentSpeed?: number
  ): DashboardData['eta'] {
    try {
      const distanceKm = calculateDistance(busLat, busLng, stopLat, stopLng);

      // Use actual speed if available and reasonable, otherwise use average
      const speedKmh = (currentSpeed && currentSpeed > 5) 
        ? currentSpeed 
        : this.AVERAGE_SPEED_KMH;

      // Calculate time in minutes
      let minutes = Math.ceil((distanceKm / speedKmh) * 60);

      // Cap at maximum
      if (minutes > this.MAX_ETA_MINUTES) {
        minutes = this.MAX_ETA_MINUTES;
      }

      // If very close, show 1 minute minimum
      if (minutes < 1 && distanceKm < 0.5) {
        minutes = 1;
      }

      return {
        minutes,
        distanceKm: Math.round(distanceKm * 100) / 100,
        status: 'available',
      };
    } catch (error) {
      logger.error('ETA calculation failed', { error });
      return {
        minutes: 0,
        distanceKm: 0,
        status: 'unavailable',
      };
    }
  }

  /**
   * Validate student has access to specific bus/route
   */
  async validateAccess(studentId: string, busId?: string, routeId?: string): Promise<boolean> {
    const student = await studentRepository.getStudentWithAssignments(studentId);

    if (!student) return false;

    if (busId && student.busId !== busId) return false;
    if (routeId && student.routeId !== routeId) return false;

    return true;
  }
}

export const studentService = new StudentService();
