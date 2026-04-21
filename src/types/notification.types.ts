/**
 * Notification Domain Types
 * 
 * Type definitions for the notification system.
 */

export enum NotificationType {
  BUS_ARRIVING = 'BUS_ARRIVING',
  BUS_DELAYED = 'BUS_DELAYED',
  BUS_CANCELLED = 'BUS_CANCELLED',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  isEnabled: boolean;
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null;   // HH:mm
  updatedAt: Date;
}

export interface NotificationPayload {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}
