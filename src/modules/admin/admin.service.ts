/**
 * Admin Service
 * 
 * Business logic for admin operations:
 * - User management
 * - Fleet management
 * - Real-time monitoring
 * - Analytics aggregation
 * - Audit logging
 */

import { adminRepository } from './admin.repository';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { auditLog } from '../../utils/audit';
import { BusStatus, RouteStatus } from '@prisma/client';

export class AdminService {
  // ==================== USER MANAGEMENT ====================

  /**
   * Get students list with filters
   */
  async getStudents(filters: {
    busId?: string;
    routeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;

    const { students, total } = await adminRepository.getStudents({
      ...filters,
      offset,
    });

    return {
      data: students.map(s => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        email: s.user.email,
        phone: s.user.phone,
        department: s.department,
        semester: s.semester,
        status: s.user.status,
        bus: s.bus ? { id: s.bus.id, registrationNumber: s.bus.registrationNumber } : null,
        route: s.route ? { id: s.route.id, name: s.route.name } : null,
        pickupPoint: s.pickupPoint ? { id: s.pickupPoint.id, name: s.pickupPoint.name } : null,
      })),
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        pages: Math.ceil(total / (filters.limit || 50)),
      },
    };
  }

  /**
   * Get drivers list with filters
   */
  async getDrivers(filters: {
    isOnDuty?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;

    const { drivers, total } = await adminRepository.getDrivers({
      ...filters,
      offset,
    });

    return {
      data: drivers.map(d => ({
        id: d.id,
        name: d.name,
        email: d.user.email,
        phone: d.user.phone,
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry,
        isOnDuty: d.isOnDuty,
        status: d.user.status,
        bus: d.bus ? { id: d.bus.id, registrationNumber: d.bus.registrationNumber, status: d.bus.status } : null,
      })),
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        pages: Math.ceil(total / (filters.limit || 50)),
      },
    };
  }

  /**
   * Get student details
   */
  async getStudentDetails(studentId: string) {
    const student = await adminRepository.getStudentById(studentId);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return {
      id: student.id,
      name: student.name,
      email: student.user.email,
      phone: student.user.phone,
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      address: student.address,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      status: student.user.status,
      bus: student.bus,
      route: student.route,
      pickupPoint: student.pickupPoint,
      recentAttendance: student.attendances,
      recentPayments: student.payments,
    };
  }

  /**
   * Get driver details
   */
  async getDriverDetails(driverId: string) {
    const driver = await adminRepository.getDriverById(driverId);

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    return {
      id: driver.id,
      name: driver.name,
      email: driver.user.email,
      phone: driver.user.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      emergencyContact: driver.emergencyContact,
      isOnDuty: driver.isOnDuty,
      status: driver.user.status,
      bus: driver.bus,
      recentTrips: driver.trips,
    };
  }

  // ==================== BUS & ROUTE MANAGEMENT ====================

  /**
   * Get all buses
   */
  async getBuses(filters: {
    status?: BusStatus;
    routeId?: string;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;

    const { buses, total } = await adminRepository.getBuses({
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

  /**
   * Get bus details
   */
  async getBusDetails(busId: string) {
    const bus = await adminRepository.getBusById(busId);

    if (!bus) {
      throw new AppError('Bus not found', 404);
    }

    return {
      id: bus.id,
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      manufacturer: bus.manufacturer,
      year: bus.year,
      capacity: bus.capacity,
      fuelType: bus.fuelType,
      insuranceExpiry: bus.insuranceExpiry,
      permitExpiry: bus.permitExpiry,
      status: bus.status,
      location: {
        lat: bus.currentLat,
        lng: bus.currentLng,
        lastUpdated: bus.lastLocationAt,
      },
      driver: bus.driver,
      route: bus.route,
      assignedStudents: bus.students,
    };
  }

  /**
   * Create a new bus
   */
  async createBus(data: {
    registrationNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    capacity: number;
    fuelType: string;
  }, adminId: string) {
    // Check for duplicate registration
    const existing = await adminRepository.getBusById(data.registrationNumber);
    if (existing) {
      throw new AppError('Bus with this registration number already exists', 409);
    }

    const bus = await adminRepository.createBus(data);

    auditLog('BUS_CREATED', adminId, {
      busId: bus.id,
      registrationNumber: bus.registrationNumber,
    });

    return bus;
  }

  /**
   * Update bus
   */
  async updateBus(
    busId: string,
    data: Partial<{
      status: BusStatus;
      currentDriverId: string | null;
      currentRouteId: string | null;
      model: string;
      capacity: number;
    }>,
    adminId: string
  ) {
    const bus = await adminRepository.updateBus(busId, data);

    auditLog('BUS_UPDATED', adminId, {
      busId: bus.id,
      changes: Object.keys(data),
    });

    return bus;
  }

  /**
   * Get all routes
   */
  async getRoutes(filters: {
    status?: RouteStatus;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;

    const { routes, total } = await adminRepository.getRoutes({
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

  /**
   * Get route details
   */
  async getRouteDetails(routeId: string) {
    const route = await adminRepository.getRouteById(routeId);

    if (!route) {
      throw new AppError('Route not found', 404);
    }

    return {
      id: route.id,
      name: route.name,
      routeNumber: route.routeNumber,
      description: route.description,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      totalDistance: route.totalDistance,
      estimatedDuration: route.estimatedDuration,
      status: route.status,
      pathGeoJson: route.pathGeoJson,
      stops: route.pickupPoints,
      buses: route.buses.map(b => ({
        id: b.id,
        registrationNumber: b.registrationNumber,
        status: b.status,
        driver: b.driver,
      })),
      students: route.students,
    };
  }

  /**
   * Create a new route
   */
  async createRoute(data: {
    name: string;
    routeNumber: string;
    description?: string;
    startLocation: string;
    endLocation: string;
    totalDistance: number;
    estimatedDuration: number;
  }, adminId: string) {
    const route = await adminRepository.createRoute(data);

    auditLog('ROUTE_CREATED', adminId, {
      routeId: route.id,
      routeNumber: route.routeNumber,
    });

    return route;
  }

  /**
   * Update route
   */
  async updateRoute(
    routeId: string,
    data: Partial<{
      status: RouteStatus;
      name: string;
      totalDistance: number;
      estimatedDuration: number;
    }>,
    adminId: string
  ) {
    const route = await adminRepository.updateRoute(routeId, data);

    auditLog('ROUTE_UPDATED', adminId, {
      routeId: route.id,
      changes: Object.keys(data),
    });

    return route;
  }

  // ==================== REAL-TIME MONITORING ====================

  /**
   * Get live bus monitoring data
   */
  async getLiveBuses() {
    const buses = await adminRepository.getLiveBuses();

    return {
      lastUpdated: new Date().toISOString(),
      buses: buses.map(b => ({
        id: b.id,
        registrationNumber: b.registrationNumber,
        status: b.status,
        location: b.currentLat && b.currentLng ? {
          lat: b.currentLat,
          lng: b.currentLng,
          lastUpdated: b.lastLocationAt,
        } : null,
        driver: b.driver ? {
          id: b.driver.id,
          name: b.driver.name,
          phone: b.driver.phone,
          isOnDuty: b.driver.isOnDuty,
        } : null,
        route: b.route ? {
          id: b.route.id,
          name: b.route.name,
        } : null,
        studentCount: b.students.length,
      })),
    };
  }

  /**
   * Get active trips
   */
  async getActiveTrips() {
    const trips = await adminRepository.getActiveTrips();

    return {
      count: trips.length,
      trips: trips.map(t => ({
        id: t.id,
        driver: t.driver,
        bus: {
          id: t.bus.id,
          registrationNumber: t.bus.registrationNumber,
          currentLocation: t.bus.currentLat && t.bus.currentLng ? {
            lat: t.bus.currentLat,
            lng: t.bus.currentLng,
          } : null,
        },
        route: t.route,
        startTime: t.startTime,
        duration: Math.floor((Date.now() - t.startTime.getTime()) / 60000), // minutes
      })),
    };
  }

  // ==================== ANALYTICS ====================

  /**
   * Get system overview
   */
  async getOverview() {
    return adminRepository.getOverviewStats();
  }

  /**
   * Get pickup analytics
   */
  async getPickupAnalytics(days: number = 30) {
    return adminRepository.getPickupAnalytics(days);
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(days: number = 30) {
    return adminRepository.getAttendanceAnalytics(days);
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(days: number = 30) {
    return adminRepository.getPaymentAnalytics(days);
  }

  // ==================== ASSIGNMENTS ====================

  /**
   * Assign bus to driver
   */
  async assignBusToDriver(
    driverId: string,
    busId: string | null,
    adminId: string
  ) {
    const driver = await adminRepository.assignBusToDriver(driverId, busId);

    auditLog('DRIVER_BUS_ASSIGNED', adminId, {
      driverId,
      busId,
      driverName: driver.name,
    });

    return {
      driver: {
        id: driver.id,
        name: driver.name,
        bus: driver.bus,
      },
      message: busId ? 'Bus assigned successfully' : 'Bus unassigned successfully',
    };
  }

  /**
   * Assign student to bus and route
   */
  async assignStudentBusRoute(
    studentId: string,
    busId: string | null,
    routeId: string | null,
    pickupPointId: string | null,
    adminId: string
  ) {
    const student = await adminRepository.assignStudentBusRoute(
      studentId,
      busId,
      routeId,
      pickupPointId
    );

    auditLog('STUDENT_ASSIGNMENT_UPDATED', adminId, {
      studentId,
      busId,
      routeId,
      pickupPointId,
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        bus: student.bus,
        route: student.route,
        pickupPoint: student.pickupPoint,
      },
      message: 'Student assignments updated successfully',
    };
  }
}

export const adminService = new AdminService();
