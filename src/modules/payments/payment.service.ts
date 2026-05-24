/**
 * Payment Service
 * 
 * Business logic for payment operations:
 * - Razorpay integration
 * - Payment initiation and verification
 * - Student fee management
 * - Notifications
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentRepository, paymentRepository } from './payment.repository';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';
import { auditLog } from '../../utils/audit';
import { io } from '../../sockets';
import { StudentEvents } from '../../sockets/events';
import config from '../../config/app.config';

export interface PaymentInitiateData {
  studentId: string;
  amount: number; // in rupees
  description: string;
  dueDate?: Date;
}

export interface PaymentVerifyData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface StudentFeesSummary {
  pendingAmount: number;
  pendingCount: number;
  totalPaid: number;
  history: Array<{
    id: string;
    amount: number;
    status: string;
    description: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
}

export class PaymentService {
  private razorpay: Razorpay;

  constructor(config: any = {}) {
    const keyId = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are missing");
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Get student's fees summary and payment history
   */
  async getMyFees(studentId: string): Promise<StudentFeesSummary> {
    const [payments, summary] = await Promise.all([
      this.repository.getStudentPayments(studentId),
      this.repository.getStudentPendingSummary(studentId),
    ]);

    return {
      pendingAmount: summary.pendingAmount,
      pendingCount: summary.pendingCount,
      totalPaid: summary.totalPaid,
      history: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        description: p.description,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Initiate payment - create Razorpay order
   */
  async initiatePayment(data: PaymentInitiateData) {
    const { studentId, amount, description, dueDate } = data;

    // Validate amount
    if (amount < 1) {
      throw new AppError('Amount must be at least ₹1', 400);
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `fee_${studentId}_${Date.now()}`,
      notes: {
        studentId,
        description,
      },
    };

    let order;
    try {
      order = await this.razorpay.orders.create(orderOptions);
    } catch (error) {
      logger.error('Razorpay order creation failed', { error, studentId });
      throw new AppError('Failed to create payment order', 500);
    }

    // Save payment record
    const payment = await this.repository.createPayment({
      studentId,
      amount,
      description,
      razorpayOrderId: order.id,
      dueDate,
    });

    logger.info('Payment initiated', { paymentId: payment.id, orderId: order.id, studentId });

    // Return order details for frontend
    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpayKeyId || process.env.RAZORPAY_KEY_ID,
      description,
    };
  }

  /**
   * Verify payment signature and update status
   * 
   * CRITICAL: This is the only trusted verification point
   * NEVER trust frontend payment success
   */
  async verifyPayment(data: PaymentVerifyData, studentId: string) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    // Get payment record
    const payment = await this.repository.getPaymentByOrderId(razorpayOrderId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Verify ownership
    if (payment.studentId !== studentId) {
      throw new AppError('Unauthorized to verify this payment', 403);
    }

    // Check if already processed
    if (payment.status === 'PAID') {
      return {
        success: true,
        message: 'Payment already verified',
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      };
    }

    if (payment.status === 'FAILED') {
      throw new AppError('Payment was previously failed', 400);
    }

    // Verify signature
    const keySecret = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpaySignature;

    if (!isSignatureValid) {
      // Log fraud attempt
      logger.warn('Invalid payment signature', {
        paymentId: payment.id,
        studentId,
        orderId: razorpayOrderId,
      });

      // Update as failed
      await this.repository.updatePaymentStatus(
        payment.id,
        'FAILED',
        undefined,
        undefined,
        'Invalid signature'
      );

      throw new AppError('Payment verification failed - invalid signature', 400);
    }

    // Verify with Razorpay API (optional but recommended)
    let razorpayPayment;
    try {
      razorpayPayment = await this.razorpay.payments.fetch(razorpayPaymentId);
    } catch (error) {
      logger.error('Razorpay payment fetch failed', { error, paymentId: razorpayPaymentId });
    }

    if (razorpayPayment && razorpayPayment.status !== 'captured') {
      // Payment not captured yet
      await this.repository.updatePaymentStatus(
        payment.id,
        'FAILED',
        razorpayPaymentId,
        undefined,
        `Razorpay status: ${razorpayPayment.status}`
      );

      throw new AppError(`Payment not successful - status: ${razorpayPayment.status}`, 400);
    }

    // Update payment as successful
    const updatedPayment = await this.repository.updatePaymentStatus(
      payment.id,
      'PAID',
      razorpayPaymentId,
      new Date()
    );

    logger.info('Payment verified successfully', {
      paymentId: payment.id,
      orderId: razorpayOrderId,
      razorpayPaymentId,
      studentId,
      amount: payment.amount,
    });

    // Audit log
    auditLog('PAYMENT_SUCCESS', studentId, {
      paymentId: payment.id,
      amount: payment.amount,
      razorpayPaymentId,
    });

    // Notify student via socket
    this.notifyPaymentSuccess(payment.studentId, {
      paymentId: payment.id,
      amount: payment.amount,
      description: payment.description,
    });

    return {
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        paidAt: updatedPayment.paidAt,
        description: updatedPayment.description,
      },
    };
  }

  /**
   * Get all payments (admin view)
   */
  async getAllPayments(filters: {
    status?: 'PENDING' | 'PAID' | 'FAILED';
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const offset = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;

    const { payments, total } = await this.repository.getAllPayments({
      ...filters,
      offset,
    });

    return {
      data: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        description: p.description,
        student: p.student,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        dueDate: p.dueDate,
      })),
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        pages: Math.ceil(total / (filters.limit || 50)),
      },
    };
  }

  /**
   * Get defaulters list
   */
  async getDefaulters() {
    return this.repository.getDefaulters();
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    return this.repository.getPaymentStats();
  }

  /**
   * Handle Razorpay webhook (optional but recommended)
   * This provides additional security and handles edge cases
   */
  async handleWebhook(payload: any, signature: string) {
    const keySecret = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret!)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Invalid webhook signature');
      throw new AppError('Invalid webhook signature', 400);
    }

    const { event, payload: eventPayload } = payload;

    logger.info('Razorpay webhook received', { event });

    if (event === 'payment.captured') {
      const { payment } = eventPayload;
      const orderId = payment.order_id;

      // Find and update payment
      const dbPayment = await this.repository.getPaymentByOrderId(orderId);
      if (dbPayment && dbPayment.status === 'PENDING') {
        await this.repository.updatePaymentStatus(
          dbPayment.id,
          'PAID',
          payment.id,
          new Date(payment.captured_at * 1000)
        );

        this.notifyPaymentSuccess(dbPayment.studentId, {
          paymentId: dbPayment.id,
          amount: dbPayment.amount,
          description: dbPayment.description,
        });
      }
    }

    if (event === 'payment.failed') {
      const { payment } = eventPayload;
      const orderId = payment.order_id;

      const dbPayment = await this.repository.getPaymentByOrderId(orderId);
      if (dbPayment) {
        await this.repository.updatePaymentStatus(
          dbPayment.id,
          'FAILED',
          payment.id,
          undefined,
          payment.error_description || 'Payment failed'
        );

        this.notifyPaymentFailure(dbPayment.studentId, {
          paymentId: dbPayment.id,
          amount: dbPayment.amount,
          reason: payment.error_description || 'Payment failed',
        });
      }
    }

    return { received: true };
  }

  /**
   * Notify student of successful payment
   */
  private notifyPaymentSuccess(studentId: string, data: {
    paymentId: string;
    amount: number;
    description: string;
  }) {
    try {
      io.to(`student:${studentId}`).emit(StudentEvents.PAYMENT_SUCCESS, {
        type: 'payment_success',
        data: {
          paymentId: data.paymentId,
          amount: data.amount,
          description: data.description,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info('Payment success notification sent', { studentId, paymentId: data.paymentId });
    } catch (error) {
      logger.error('Failed to send payment notification', { error, studentId });
    }
  }

  /**
   * Notify student of failed payment
   */
  private notifyPaymentFailure(studentId: string, data: {
    paymentId: string;
    amount: number;
    reason: string;
  }) {
    try {
      io.to(`student:${studentId}`).emit(StudentEvents.PAYMENT_FAILED, {
        type: 'payment_failed',
        data: {
          paymentId: data.paymentId,
          amount: data.amount,
          reason: data.reason,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info('Payment failure notification sent', { studentId, paymentId: data.paymentId });
    } catch (error) {
      logger.error('Failed to send payment failure notification', { error, studentId });
    }
  }
}

export const paymentService = new PaymentService(paymentRepository);

