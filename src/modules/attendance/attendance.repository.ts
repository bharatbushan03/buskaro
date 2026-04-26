/**
 * Attendance Repository
 *
 * Database operations for attendance management:
 * - Automated attendance marking
 * - Geo-based student queries
 * - Duplicate prevention
 * - Admin reporting
 */

import { PrismaClient, AttendanceStatus, BusStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface AttendanceCreateData {
  studentId: string;
  busId: string;
  routeId: string;
  pickupPointId?: string;
  date: Date;
  status: AttendanceStatus;
  boardingTime: Date;
  boardingLat: number;
  boardingLng: number;
  distanceFromBus: number;
  tripId?: string;
}

export class AttendanceRepository {
  /**
   * Check if attendance already exists for student on date
   */
  async hasAttendanceToday(studentId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.attendance.count({
      where: {
        studentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return count > 0;
  }

  /**
   * Get today's attendance for a student
   */
  async getTodayAttendance(studentId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        bus: { select: { registrationNumber: true } },
        route: { select: { name: true } },
        pickupPoint: { select: { name: true } },
      },
    });
  }

  /**
   * Create attendance record
   */
  async createAttendance(data: AttendanceCreateData) {
    return prisma.attendance.create({
      data: {
        studentId: data.studentId,
        busId: data.busId,
        routeId: data.routeId,
        pickupPointId: data.pickupPointId,
        date: data.date,
        status: data.status,
        boardingTime: data.boardingTime,
        boardingLat: data.boardingLat,
        boardingLng: data.boardingLng,
        distanceFromBus: data.distanceFromBus,
        tripId: data.tripId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            user: { select: { email: true, phone: true } },
          },
        },
        bus: { select: { registrationNumber: true } },
        route: { select: { name: true } },
      },
    });
  }

  /**
   * Get students near a location (within radius in meters)
   * Uses Haversine formula for distance calculation
   */
  async getStudentsNearLocation(
    lat: number,
    lng: number,
    radiusMeters: number,
    busId: string,
    routeId: string
  ) {
    // Convert radius to kilometers for Haversine
    const radiusKm = radiusMeters / 1000;

    // Get students assigned to this bus/route
    const students = await prisma.student.findMany({
      where: {
        busId,
        routeId,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        pickupPoint: true,
      },
    });

    // Filter by distance using Haversine formula
    const nearbyStudents = students.filter((student) => {
      if (!student.currentLat || !student.currentLng) return false;

      const distance = this.calculateDistance(
        lat,
        lng,
        student.currentLat,
        student.currentLng
      );

      return distance <= radiusKm;
    });

    return nearbyStudents.map((student) => ({
      ...student,
      distance: this.calculateDistance(
        lat,
        lng,
        student.currentLat!,
        student.currentLng!
      ),
    }));
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
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
   * Get bus with active trip status
   */
  async getBusWithTrip(busId: string) {
    return prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: true,
        trips: {
          where: { status: 'IN_PROGRESS' },
          take: 1,
        },
      },
    });
  }

  /**
   * Get all attendances with filters (admin view)
   */
  async getAttendances(filters: {
    date?: Date;
    routeId?: string;
    studentId?: string;
    busId?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.busId) where.busId = filters.busId;
    if (filters.status) where.status = filters.status;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              department: true,
              user: { select: { email: true } },
            },
          },
          bus: { select: { registrationNumber: true } },
          route: { select: { name: true } },
          pickupPoint: { select: { name: true } },
        },
        orderBy: { boardingTime: 'desc' },
        skip: filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0,
        take: filters.limit || 50,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendances, total };
  }

  /**
   * Get attendance statistics for a date
   */
  async getAttendanceStats(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [total, present, absent, late] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'PRESENT',
        },
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'ABSENT',
        },
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'LATE',
        },
      }),
    ]);

    // Get route-wise breakdown
    const routeWise = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.name,
        COUNT(a.id) as total,
        COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent
      FROM attendances a
      JOIN routes r ON a.route_id = r.id
      WHERE a.date >= ${startOfDay} AND a.date <= ${endOfDay}
      GROUP BY r.id, r.name
    `;

    return {
      total,
      present,
      absent,
      late,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      routeWise,
    };
  }

  /**
   * Get student's attendance history
   */
  async getStudentAttendanceHistory(studentId: string, limit: number = 30) {
    return prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        bus: { select: { registrationNumber: true } },
        route: { select: { name: true } },
        pickupPoint: { select: { name: true } },
      },
    });
  }
}

export const attendanceRepository = new AttendanceRepository();

