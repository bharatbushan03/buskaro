/**
 * Bus Controller - Module Structure
 */

import { BusService, busService } from './bus.service';

export class BusController {
  constructor(private service: BusService) {}
  
  // Bus CRUD endpoints
  // Location endpoints
  // Assignment endpoints
}

export const busController = new BusController(busService);
