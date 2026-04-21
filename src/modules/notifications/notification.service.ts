/**
 * Notification Service - Module Structure
 */

import { NotificationRepository, notificationRepository } from './notification.repository';

export class NotificationService {
  constructor(private repository: NotificationRepository) {}
}

export const notificationService = new NotificationService(notificationRepository);
