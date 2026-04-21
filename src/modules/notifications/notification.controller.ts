/**
 * Notification Controller - Module Structure
 */

import { NotificationService, notificationService } from './notification.service';

export class NotificationController {
  constructor(private service: NotificationService) {}
}

export const notificationController = new NotificationController(notificationService);
