/**
 * Pickup Controller - Module Structure
 */

import { PickupService, pickupService } from './pickup.service';

export class PickupController {
  constructor(private service: PickupService) {}
}

export const pickupController = new PickupController(pickupService);
