/**
 * Student Repository
 * 
 * Database operations for student operations including:
 * - Student profile and assignments
 * - Bus location queries
 * - Route and pickup data
 * - Attendance and payment summaries
 */

import { PrismaClient, AttendanceStatus, PaymentStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class StudentRepository {
  /**
   * Get student with full profile and assignments
   */
  async getStudentWithAssignments(studentId: string) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
            capacity: true,
            status: true,
            currentLat: true,
            currentLng: true,
            lastLocationAt: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        route: {
          include: {
            pickupPoints: {
              orderBy: { sequenceOrder: 'asc' },
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                arrivalTime: true,
                sequenceOrder: true,
              },
            },
          },
        },
        pickupPoint: true,
      },
    });
  }

  /**
   * Get active pickup request for student
   */
  async getActivePickup(studentId: string) {
    return prisma.pickupRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { gt: new Date() },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        bus: {
          select: {
            id: true,
            registrationNumber: true,
          },
        },
      },
    });
  }

  /**
   * Get bus location for student's assigned bus
   */
  async getBusLocation(busId: string) {
    return prisma.bus.findUnique({
      where: { id: busId },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        status: true,
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get recent location history for bus (last 10 points)
   */
  async getBusLocationHistory(busId: string, limit: number = 10) {
    return prisma.locationHistory.findMany({
      where: { busId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      select: {
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        recordedAt: true,
      },
    });
  }

  /**
   * Get route with full details
   */
  async getRouteWithStops(routeId: string) {
    return prisma.route.findUnique({
      where: { id: routeId },
      include: {
        pickupPoints: {
          orderBy: { sequenceOrder: 'asc' },
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            landmark: true,
            arrivalTime: true,
            sequenceOrder: true,
            estimatedWaitMinutes: true,
          },
        },
        buses: {
          where: { status: { not: 'MAINTENANCE' } },
          select: {
            id: true,
            registrationNumber: true,
            currentLat: true,
            currentLng: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get attendance summary for student
   */
  async getAttendanceSummary(studentId: string) {
    const [total, present, absent, late] = await Promise.all([
      prisma.attendance.count({ where: { studentId } }),
      prisma.attendance.count({ where: { studentId, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { studentId, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { studentId, status: 'LATE' } }),
    ]);

    // Get last 7 days attendance
    const recentAttendance = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 7,
      select: {
        id: true,
        date: true,
        status: true,
        boardingTime: true,
        pickupPoint: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      summary: {
        total,
        present,
        absent,
        late,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      recent: recentAttendance,
    };
  }

  /**
   * Get payment summary for student
   */
  async getPaymentSummary(studentId: string) {
    const [total, paid, pending, failed] = await Promise.all([
      prisma.payment.count({ where: { studentId } }),
      prisma.payment.count({ where: { studentId, status: 'PAID' } }),
      prisma.payment.count({ where: { studentId, status: 'PENDING' } }),
      prisma.payment.count({ where: { studentId, status: 'FAILED' } }),
    ]);

    // Get total paid amount
    const paidAmount = await prisma.payment.aggregate({
      where: { studentId, status: 'PAID' },
      _sum: { amount: true },
    });

    // Get pending amount
    const pendingAmount = await prisma.payment.aggregate({
      where: { studentId, status: 'PENDING' },
      _sum: { amount: true },
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return {
      summary: {
        total,
        paid,
        pending,
        failed,
        paidAmount: paidAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
      },
      recent: recentPayments,
    };
  }

  /**
   * Get pickup history for student
   */
  async getPickupHistory(studentId: string, limit: number = 10) {
    return prisma.pickupRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        latitude: true,
        longitude: true,
        requestedAt: true,
        completedAt: true,
        expiresAt: true,
        driver: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get upcoming pickup point arrival (based on schedule)
   */
  async getNextScheduledPickup(pickupPointId: string) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return prisma.pickupPoint.findFirst({
      where: {
        id: pickupPointId,
        arrivalTime: { gte: currentTime },
      },
      orderBy: { arrivalTime: 'asc' },
      select: {
        arrivalTime: true,
        estimatedWaitMinutes: true,
      },
    });
  }
}

export const studentRepository = new StudentRepository();
