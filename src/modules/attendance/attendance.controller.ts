/**
 * Attendance Controller - Module Structure
 */

import { AttendanceService, attendanceService } from './attendance.service';

export class AttendanceController {
  constructor(private service: AttendanceService) {}
}

export const attendanceController = new AttendanceController(attendanceService);
