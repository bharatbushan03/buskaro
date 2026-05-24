/**
 * Bus Controller - Module Structure
 */

import { Request, Response } from 'express';
import { BusService, busService } from './bus.service';

export class BusController {
  constructor(private service: BusService) {}

  async getBuses(req: Request, res: Response) {
    const filters = req.query;
    const data = await this.service.getBuses(filters as any);
    res.status(200).json({ success: true, data });
  }

  async getBus(req: Request, res: Response) {
    const { id } = req.params;
    const data = await this.service.getBusDetails(id);
    res.status(200).json({ success: true, data });
  }

  async createBus(req: Request, res: Response) {
    const data = await this.service.createBus(req.body);
    res.status(201).json({ success: true, data });
  }

  async updateBus(req: Request, res: Response) {
    const { id } = req.params;
    const data = await this.service.updateBus(id, req.body);
    res.status(200).json({ success: true, data });
  }
}

export const busController = new BusController(busService);
