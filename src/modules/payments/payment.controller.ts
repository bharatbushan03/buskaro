/**
 * Payment Controller - Module Structure
 */

import { PaymentService, paymentService } from './payment.service';

export class PaymentController {
  constructor(private service: PaymentService) {}
}

export const paymentController = new PaymentController(paymentService);
