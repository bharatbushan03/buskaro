/**
 * Attendance Service - Module Structure
 */

import { AttendanceRepository, attendanceRepository } from './attendance.repository';

export class AttendanceService {
  constructor(private repository: AttendanceRepository) {}
}

export const attendanceService = new AttendanceService(attendanceRepository);
