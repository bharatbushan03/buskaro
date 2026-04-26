/**
 * Payment Routes
 * 
 * Fee management and payment processing:
 * - Student endpoints: my-fees, initiate, verify
 * - Admin endpoints: list payments, defaulters, stats
 * - Webhook endpoint (no auth)
 */

import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// ==================== STUDENT ENDPOINTS ====================
// All student payment routes require authentication and STUDENT role
router.use('/my-fees', authenticate, requireRole(UserRole.STUDENT));
router.use('/initiate', authenticate, requireRole(UserRole.STUDENT));
router.use('/verify', authenticate, requireRole(UserRole.STUDENT));

/**
 * @route   GET /api/payments/my-fees
 * @desc    Get student's fees summary and payment history
 * @access  Private (Student)
 */
router.get('/my-fees', paymentController.getMyFees);

/**
 * @route   POST /api/payments/initiate
 * @desc    Create Razorpay order for payment
 * @access  Private (Student)
 */
router.post('/initiate', paymentController.initiatePayment);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature and complete transaction
 * @access  Private (Student)
 */
router.post('/verify', paymentController.verifyPayment);

// ==================== ADMIN ENDPOINTS ====================
// These are also accessible under /api/admin/payments prefix in main router

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments (admin view)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  paymentController.getAllPayments
);

/**
 * @route   GET /api/admin/payments/defaulters
 * @desc    Get students with overdue payments
 * @access  Private (Admin)
 */
router.get(
  '/defaulters',
  authenticate,
  requireRole(UserRole.ADMIN),
  paymentController.getDefaulters
);

/**
 * @route   GET /api/admin/payments/stats
 * @desc    Get payment statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN),
  paymentController.getPaymentStats
);

// ==================== WEBHOOK ====================
// No authentication - Razorpay will call this
// Should be mounted at /api/payments/webhook

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (Webhook)
 */
router.post('/webhook', paymentController.handleWebhook);

export { router as paymentRoutes };
export default router;
