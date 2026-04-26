/**
 * Attendance Service
 *
 * Business logic for attendance operations:
 * - Automated geo-based attendance marking
 * - Anti-fraud validation
 * - Socket event notifications
 * - Manual fallback
 */

import { attendanceRepository, AttendanceCreateData } from './attendance.repository';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { io } from '../../sockets';
import { StudentEvents, AdminEvents, getStudentRoom, getAdminRoom } from '../../sockets/events';
import { auditLog } from '../../utils/audit';
import { AttendanceStatus } from '@prisma/client';

export interface AutoMarkResult {
  studentId: string;
  status: 'marked' | 'already_marked' | 'too_far' | 'invalid_bus' | 'error';
  distance?: number;
  attendanceId?: string;
}

export interface BusLocationUpdate {
  busId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
}

export class AttendanceService {
  // Configuration
  private readonly BOARDING_RADIUS_METERS = 100; // 100m boarding radius
  private readonly MIN_BOARDING_SPEED = 0; // km/h - bus can be stationary
  private readonly MAX_BOARDING_SPEED = 15; // km/h - bus shouldn't be too fast
  private readonly RECENT_LOCATION_THRESHOLD_MS = 300000; // 5 minutes

  /**
   * Process bus location update and mark attendance for nearby students
   * Triggered by driver:location-update socket event
   */
  async processBusLocationUpdate(data: BusLocationUpdate): Promise<AutoMarkResult[]> {
    const { busId, lat, lng, speed, timestamp } = data;

    try {
      // 1. Validate bus is in service and on active trip
      const bus = await attendanceRepository.getBusWithTrip(busId);

      if (!bus) {
        logger.warn('Bus not found for attendance check', { busId });
        return [];
      }

      if (bus.status !== 'ACTIVE' && bus.status !== 'IN_SERVICE') {
        logger.debug('Bus not in service, skipping attendance', { busId, status: bus.status });
        return [];
      }

      if (!bus.routeId) {
        logger.warn('Bus has no assigned route', { busId });
        return [];
      }

      // 2. Validate bus speed (anti-fraud: bus should be moving reasonably)
      if (speed !== undefined && speed > this.MAX_BOARDING_SPEED) {
        logger.debug('Bus moving too fast for boarding', { busId, speed });
        return [];
      }

      // 3. Find students near the bus location
      const nearbyStudents = await attendanceRepository.getStudentsNearLocation(
        lat,
        lng,
        this.BOARDING_RADIUS_METERS,
        busId,
        bus.routeId
      );

      if (nearbyStudents.length === 0) {
        return [];
      }

      // 4. Process each nearby student
      const results: AutoMarkResult[] = [];
      const today = new Date();

      for (const student of nearbyStudents) {
        const result = await this.markAttendanceForStudent({
          studentId: student.id,
          busId,
          routeId: bus.routeId!,
          pickupPointId: student.pickupPointId || undefined,
          lat,
          lng,
          distance: (student as any).distance,
          today,
          tripId: bus.trips[0]?.id,
        });

        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Error processing bus location for attendance', { error, busId });
      return [];
    }
  }

  /**
   * Mark attendance for a single student with all validations
   */
  private async markAttendanceForStudent(data: {
    studentId: string;
    busId: string;
    routeId: string;
    pickupPointId?: string;
    lat: number;
    lng: number;
    distance: number;
    today: Date;
    tripId?: string;
  }): Promise<AutoMarkResult> {
    const { studentId, busId, routeId, pickupPointId, lat, lng, distance, today, tripId } = data;

    try {
      // 1. Check for duplicate attendance today
      const hasAttendance = await attendanceRepository.hasAttendanceToday(studentId, today);
      if (hasAttendance) {
        return {
          studentId,
          status: 'already_marked',
          distance,
        };
      }

      // 2. Determine status based on time/distance
      const status = this.determineAttendanceStatus(distance, today);

      // 3. Create attendance record
      const attendance = await attendanceRepository.createAttendance({
        studentId,
        busId,
        routeId,
        pickupPointId,
        date: today,
        status,
        boardingTime: new Date(),
        boardingLat: lat,
        boardingLng: lng,
        distanceFromBus: Math.round(distance * 1000), // Convert km to meters
        tripId,
      });

      // 4. Notify student via socket
      this.notifyAttendanceMarked(studentId, {
        attendanceId: attendance.id,
        status,
        distance: Math.round(distance * 1000),
        busNumber: attendance.bus.registrationNumber,
        routeName: attendance.route.name,
        timestamp: new Date().toISOString(),
      });

      // 5. Log for audit
      auditLog('ATTENDANCE_AUTO_MARKED', studentId, {
        attendanceId: attendance.id,
        busId,
        routeId,
        distance: Math.round(distance * 1000),
        status,
      });

      logger.info('Attendance auto-marked', {
        studentId,
        attendanceId: attendance.id,
        distance: Math.round(distance * 1000),
        status,
      });

      return {
        studentId,
        status: 'marked',
        distance,
        attendanceId: attendance.id,
      };
    } catch (error) {
      logger.error('Error marking attendance for student', { error, studentId, busId });
      return {
        studentId,
        status: 'error',
        distance,
      };
    }
  }

  /**
   * Determine attendance status based on distance and time
   */
  private determineAttendanceStatus(distanceKm: number, _date: Date): AttendanceStatus {
    const distanceMeters = distanceKm * 1000;

    // Within 50m: Present
    if (distanceMeters <= 50) {
      return 'PRESENT';
    }

    // Within 100m: Late (slightly further away)
    if (distanceMeters <= 100) {
      return 'LATE';
    }

    // Should not happen due to radius filter, but just in case
    return 'ABSENT';
  }

  /**
   * Manual attendance marking (fallback)
   */
  async markAttendanceManually(data: {
    studentId: string;
    busId: string;
    routeId: string;
    lat: number;
    lng: number;
    status: AttendanceStatus;
    markedBy: string;
    reason?: string;
  }) {
    const { studentId, busId, routeId, lat, lng, status, markedBy, reason } = data;

    // Check for duplicate
    const today = new Date();
    const hasAttendance = await attendanceRepository.hasAttendanceToday(studentId, today);
    if (hasAttendance) {
      throw new AppError('Attendance already marked for today', 409);
    }

    // Create attendance
    const attendance = await attendanceRepository.createAttendance({
      studentId,
      busId,
      routeId,
      date: today,
      status,
      boardingTime: new Date(),
      boardingLat: lat,
      boardingLng: lng,
      distanceFromBus: 0,
    });

    // Audit log
    auditLog('ATTENDANCE_MANUAL_MARKED', markedBy, {
      studentId,
      attendanceId: attendance.id,
      busId,
      status,
      reason,
    });

    // Notify student
    this.notifyAttendanceMarked(studentId, {
      attendanceId: attendance.id,
      status,
      distance: 0,
      busNumber: attendance.bus.registrationNumber,
      routeName: attendance.route.name,
      timestamp: new Date().toISOString(),
      isManual: true,
    });

    return attendance;
  }

  /**
   * Get today's attendance for a student
   */
  async getTodayAttendance(studentId: string) {
    const today = new Date();
    const attendance = await attendanceRepository.getTodayAttendance(studentId, today);

    if (!attendance) {
      return null;
    }

    return {
      id: attendance.id,
      status: attendance.status,
      date: attendance.date,
      boardingTime: attendance.boardingTime,
      distanceFromBus: attendance.distanceFromBus,
      bus: attendance.bus,
      route: attendance.route,
      pickupPoint: attendance.pickupPoint,
    };
  }

  /**
   * Get attendance history for student
   */
  async getStudentHistory(studentId: string, limit: number = 30) {
    return attendanceRepository.getStudentAttendanceHistory(studentId, limit);
  }

  /**
   * Get all attendances (admin view)
   */
  async getAllAttendances(filters: {
    date?: Date;
    routeId?: string;
    studentId?: string;
    busId?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  }) {
    return attendanceRepository.getAttendances(filters);
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(date?: Date) {
    const targetDate = date || new Date();
    return attendanceRepository.getAttendanceStats(targetDate);
  }

  /**
   * Notify student that attendance has been marked
   */
  private notifyAttendanceMarked(
    studentId: string,
    data: {
      attendanceId: string;
      status: AttendanceStatus;
      distance: number;
      busNumber: string;
      routeName: string;
      timestamp: string;
      isManual?: boolean;
    }
  ) {
    try {
      const room = getStudentRoom(studentId);

      io.to(room).emit(StudentEvents.BUS_ARRIVAL, {
        type: 'attendance_marked',
        data: {
          ...data,
          status: data.status.toLowerCase(),
        },
      });

      // Also notify admin dashboard
      io.to(getAdminRoom()).emit(AdminEvents.DASHBOARD_UPDATE, {
        type: 'attendance_update',
        data: {
          studentId,
          ...data,
        },
      });

      logger.debug('Attendance notification sent', { studentId, attendanceId: data.attendanceId });
    } catch (error) {
      logger.error('Failed to send attendance notification', { error, studentId });
    }
  }
}

export const attendanceService = new AttendanceService();

