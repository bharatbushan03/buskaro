/**
 * Route Controller - Module Structure
 */

import { Request, Response } from 'express';
import { RouteService, routeService } from './route.service';

export class RouteController {
  constructor(private service: RouteService) {}

  async getRoutes(req: Request, res: Response) {
    const filters = req.query;
    const data = await this.service.getRoutes(filters as any);
    res.status(200).json({ success: true, data });
  }

  async getRoute(req: Request, res: Response) {
    const { id } = req.params;
    const data = await this.service.getRouteDetails(id);
    res.status(200).json({ success: true, data });
  }

  async createRoute(req: Request, res: Response) {
    const data = await this.service.createRoute(req.body);
    res.status(201).json({ success: true, data });
  }

  async updateRoute(req: Request, res: Response) {
    const { id } = req.params;
    const data = await this.service.updateRoute(id, req.body);
    res.status(200).json({ success: true, data });
  }

  async deleteRoute(req: Request, res: Response) {
    const { id } = req.params;
    const data = await this.service.deleteRoute(id);
    res.status(200).json({ success: true, data });
  }
}

export const routeController = new RouteController(routeService);
