/**
 * Admin Repository
 * 
 * Database operations for admin management:
 * - User management (students, drivers)
 * - Bus and route management
 * - Real-time monitoring queries
 * - Analytics aggregations
 */

import { PrismaClient, BusStatus, RouteStatus, UserStatus, PickupRequestStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class AdminRepository {
  // ==================== USER MANAGEMENT ====================

  /**
   * Get all students with filtering
   */
  async getStudents(filters: {
    busId?: string;
    routeId?: string;
    status?: UserStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.busId) where.busId = filters.busId;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { rollNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, phone: true, status: true },
          },
          bus: { select: { id: true, registrationNumber: true } },
          route: { select: { id: true, name: true } },
          pickupPoint: { select: { id: true, name: true } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total };
  }

  /**
   * Get all drivers with filtering
   */
  async getDrivers(filters: {
    isOnDuty?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.isOnDuty !== undefined) where.isOnDuty = filters.isOnDuty;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, phone: true, status: true },
          },
          bus: { select: { id: true, registrationNumber: true, status: true } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    return { drivers, total };
  }

  /**
   * Get student by ID
   */
  async getStudentById(studentId: string) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        bus: true,
        route: { include: { pickupPoints: true } },
        pickupPoint: true,
        attendances: { orderBy: { date: 'desc' }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  /**
   * Get driver by ID
   */
  async getDriverById(driverId: string) {
    return prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true,
        bus: { include: { route: true } },
        trips: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  // ==================== BUS & ROUTE MANAGEMENT ====================

  /**
   * Get all buses
   */
  async getBuses(filters: {
    status?: BusStatus;
    routeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.routeId) where.currentRouteId = filters.routeId;

    const [buses, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        include: {
          driver: { select: { id: true, name: true, phone: true } },
          route: { select: { id: true, name: true } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus.count({ where }),
    ]);

    return { buses, total };
  }

  /**
   * Get bus by ID
   */
  async getBusById(busId: string) {
    return prisma.bus.findUnique({
      where: { id: busId },
      include: {
        driver: { include: { user: true } },
        route: { include: { pickupPoints: true } },
        students: { select: { id: true, name: true } },
      },
    });
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
  }) {
    return prisma.bus.create({
      data: {
        ...data,
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        permitExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  /**
   * Update bus
   */
  async updateBus(busId: string, data: Partial<{
    status: BusStatus;
    currentDriverId: string | null;
    currentRouteId: string | null;
    model: string;
    capacity: number;
  }>) {
    return prisma.bus.update({
      where: { id: busId },
      data,
      include: {
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get all routes
   */
  async getRoutes(filters: {
    status?: RouteStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: {
          buses: { select: { id: true, registrationNumber: true, status: true } },
          pickupPoints: { orderBy: { sequenceOrder: 'asc' } },
        },
        skip: filters.offset,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    return { routes, total };
  }

  /**
   * Get route by ID
   */
  async getRouteById(routeId: string) {
    return prisma.route.findUnique({
      where: { id: routeId },
      include: {
        buses: { include: { driver: true } },
        pickupPoints: { orderBy: { sequenceOrder: 'asc' } },
        students: { select: { id: true, name: true } },
      },
    });
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
  }) {
    return prisma.route.create({ data });
  }

  /**
   * Update route
   */
  async updateRoute(routeId: string, data: Partial<{
    status: RouteStatus;
    name: string;
    totalDistance: number;
    estimatedDuration: number;
  }>) {
    return prisma.route.update({
      where: { id: routeId },
      data,
      include: { buses: true },
    });
  }

  // ==================== REAL-TIME MONITORING ====================

  /**
   * Get live bus statuses with locations
   */
  async getLiveBuses() {
    return prisma.bus.findMany({
      where: { status: { not: 'MAINTENANCE' } },
      include: {
        driver: { select: { id: true, name: true, phone: true, isOnDuty: true } },
        route: { select: { id: true, name: true } },
        students: { select: { id: true } },
      },
      orderBy: { lastLocationAt: 'desc' },
    });
  }

  /**
   * Get active trips
   */
  async getActiveTrips() {
    return prisma.trip.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        driver: { select: { id: true, name: true } },
        bus: { select: { id: true, registrationNumber: true, currentLat: true, currentLng: true } },
        route: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  // ==================== ANALYTICS ====================

  /**
   * Get system overview statistics
   */
  async getOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalDrivers,
      totalBuses,
      activeBuses,
      activeRoutes,
      tripsToday,
      totalPickupsToday,
      pendingPickups,
      attendanceToday,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.driver.count(),
      prisma.bus.count(),
      prisma.bus.count({ where: { status: 'ACTIVE' } }),
      prisma.route.count({ where: { status: 'ACTIVE' } }),
      prisma.trip.count({ where: { startTime: { gte: today } } }),
      prisma.pickupRequest.count({ where: { requestedAt: { gte: today } } }),
      prisma.pickupRequest.count({ where: { status: 'PENDING', expiresAt: { gt: new Date() } } }),
      prisma.attendance.count({ where: { date: { gte: today } } }),
    ]);

    return {
      users: {
        totalStudents,
        totalDrivers,
      },
      fleet: {
        totalBuses,
        activeBuses,
        activeRoutes,
      },
      operations: {
        tripsToday,
        totalPickupsToday,
        pendingPickups,
        attendanceToday,
      },
    };
  }

  /**
   * Get pickup analytics
   */
  async getPickupAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get pickups by status
    const pickupsByStatus = await prisma.pickupRequest.groupBy({
      by: ['status'],
      where: { requestedAt: { gte: startDate } },
      _count: { id: true },
    });

    // Get hourly distribution (peak hours)
    const hourlyDistribution = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM requested_at) as hour,
        COUNT(*) as count
      FROM pickup_requests
      WHERE requested_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM requested_at)
      ORDER BY hour
    `;

    // Get top pickup locations
    const topLocations = await prisma.$queryRaw`
      SELECT 
        TRUNC(latitude::numeric, 3) as lat,
        TRUNC(longitude::numeric, 3) as lng,
        address,
        COUNT(*) as request_count
      FROM pickup_requests
      WHERE requested_at >= ${startDate}
      GROUP BY TRUNC(latitude::numeric, 3), TRUNC(longitude::numeric, 3), address
      ORDER BY request_count DESC
      LIMIT 10
    `;

    return {
      period: `${days} days`,
      byStatus: pickupsByStatus,
      peakHours: hourlyDistribution,
      topLocations,
    };
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overall attendance rate
    const [total, present, absent, late] = await Promise.all([
      prisma.attendance.count({ where: { date: { gte: startDate } } }),
      prisma.attendance.count({ where: { date: { gte: startDate }, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: { gte: startDate }, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { date: { gte: startDate }, status: 'LATE' } }),
    ]);

    // Daily trend
    const dailyTrend = await prisma.$queryRaw`
      SELECT 
        DATE(date) as day,
        COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
        COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
        COUNT(*) FILTER (WHERE status = 'LATE') as late,
        COUNT(*) as total
      FROM attendances
      WHERE date >= ${startDate}
      GROUP BY DATE(date)
      ORDER BY day DESC
      LIMIT 30
    `;

    return {
      period: `${days} days`,
      summary: {
        total,
        present,
        absent,
        late,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      dailyTrend,
    };
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, paid, pending, failed] = await Promise.all([
      prisma.payment.count({ where: { createdAt: { gte: startDate } } }),
      prisma.payment.count({ where: { createdAt: { gte: startDate }, status: 'PAID' } }),
      prisma.payment.count({ where: { createdAt: { gte: startDate }, status: 'PENDING' } }),
      prisma.payment.count({ where: { createdAt: { gte: startDate }, status: 'FAILED' } }),
    ]);

    const revenue = await prisma.payment.aggregate({
      where: { createdAt: { gte: startDate }, status: 'PAID' },
      _sum: { amount: true },
    });

    return {
      period: `${days} days`,
      summary: {
        total,
        paid,
        pending,
        failed,
        collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
        totalRevenue: revenue._sum.amount || 0,
      },
    };
  }

  // ==================== ASSIGNMENTS ====================

  /**
   * Assign bus to driver
   */
  async assignBusToDriver(driverId: string, busId: string | null) {
    return prisma.$transaction(async (tx) => {
      // Unassign from previous driver if any
      if (busId) {
        await tx.driver.updateMany({
          where: { id: { not: driverId }, busId },
          data: { busId: null },
        });
      }

      // Assign to new driver
      const driver = await tx.driver.update({
        where: { id: driverId },
        data: { busId },
        include: { bus: true, user: true },
      });

      // Update bus currentDriverId
      if (busId) {
        await tx.bus.update({
          where: { id: busId },
          data: { currentDriverId: driverId },
        });
      }

      return driver;
    });
  }

  /**
   * Assign student to bus and route
   */
  async assignStudentBusRoute(
    studentId: string,
    busId: string | null,
    routeId: string | null,
    pickupPointId: string | null
  ) {
    return prisma.student.update({
      where: { id: studentId },
      data: { busId, routeId, pickupPointId },
      include: { bus: true, route: true, pickupPoint: true },
    });
  }
}

export const adminRepository = new AdminRepository();
