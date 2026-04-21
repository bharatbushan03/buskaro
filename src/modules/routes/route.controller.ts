/**
 * Route Controller - Module Structure
 */

import { RouteService, routeService } from './route.service';

export class RouteController {
  constructor(private service: RouteService) {}
  
  // Route endpoints
  // Pickup point endpoints
}

export const routeController = new RouteController(routeService);
