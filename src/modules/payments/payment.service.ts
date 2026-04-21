/**
 * Payment Service - Module Structure
 */

import { PaymentRepository, paymentRepository } from './payment.repository';

export class PaymentService {
  constructor(private repository: PaymentRepository) {}
}

export const paymentService = new PaymentService(paymentRepository);
