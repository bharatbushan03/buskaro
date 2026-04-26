/**
 * Payment Controller
 * 
 * HTTP request handlers for payment endpoints:
 * - Student endpoints: my-fees, initiate, verify
 * - Admin endpoints: list payments, defaulters, stats
 * - Webhook handler
 */

import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AppError } from '../../middleware/error.middleware';

export class PaymentController {
  /**
   * GET /api/payments/my-fees
   * Get student's fees summary and payment history
   */
  async getMyFees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const fees = await paymentService.getMyFees(studentId);

      res.status(200).json({
        success: true,
        data: fees,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/initiate
   * Create Razorpay order for payment
   */
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const { amount, description, dueDate } = req.body;

      if (!amount || !description) {
        throw new AppError('Amount and description are required', 400);
      }

      const paymentData = await paymentService.initiatePayment({
        studentId,
        amount: parseFloat(amount),
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Payment order created',
        data: paymentData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/verify
   * Verify payment signature and complete transaction
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;

      if (!studentId) {
        throw new AppError('Student ID not found in token', 401);
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new AppError('Missing required payment verification fields', 400);
      }

      const result = await paymentService.verifyPayment(
        {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
        studentId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/payments
   * Get all payments (admin view)
   */
  async getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, studentId, startDate, endDate, page, limit } = req.query;

      const result = await paymentService.getAllPayments({
        status: status as any,
        studentId: studentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/payments/defaulters
   * Get students with overdue payments
   */
  async getDefaulters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const defaulters = await paymentService.getDefaulters();

      res.status(200).json({
        success: true,
        count: defaulters.length,
        data: defaulters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/payments/stats
   * Get payment statistics
   */
  async getPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await paymentService.getPaymentStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhook
   * Handle Razorpay webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        throw new AppError('Missing webhook signature', 400);
      }

      const result = await paymentService.handleWebhook(req.body, signature);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
