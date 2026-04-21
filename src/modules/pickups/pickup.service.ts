/**
 * Pickup Service - Module Structure
 */

import { PickupRepository, pickupRepository } from './pickup.repository';

export class PickupService {
  constructor(private repository: PickupRepository) {}
}

export const pickupService = new PickupService(pickupRepository);
