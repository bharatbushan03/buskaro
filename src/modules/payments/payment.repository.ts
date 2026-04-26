/**
 * Payment Repository
 * 
 * Database operations for payment management:
 * - Student payment queries
 * - Admin payment queries
 * - Payment status updates
 * - Defaulters tracking
 */

import { PrismaClient, PaymentStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class PaymentRepository {
  /**
   * Get all payments for a student
   */
  async getStudentPayments(studentId: string) {
    return prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending payments summary for student
   */
  async getStudentPendingSummary(studentId: string) {
    const [pendingCount, pendingAmount, totalPaid] = await Promise.all([
      prisma.payment.count({
        where: { studentId, status: 'PENDING' },
      }),
      prisma.payment.aggregate({
        where: { studentId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { studentId, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      pendingCount,
      pendingAmount: pendingAmount._sum.amount || 0,
      totalPaid: totalPaid._sum.amount || 0,
    };
  }

  /**
   * Create a new payment record
   */
  async createPayment(data: {
    studentId: string;
    amount: number;
    description: string;
    razorpayOrderId: string;
    dueDate?: Date;
  }) {
    return prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        description: data.description,
        status: 'PENDING',
        razorpayOrderId: data.razorpayOrderId,
        dueDate: data.dueDate,
      },
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            user: { select: { email: true, phone: true } },
          },
        },
      },
    });
  }

  /**
   * Get payment by Razorpay order ID
   */
  async getPaymentByOrderId(razorpayOrderId: string) {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update payment status after verification
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    razorpayPaymentId?: string,
    paidAt?: Date,
    failureReason?: string
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        razorpayPaymentId: razorpayPaymentId || undefined,
        paidAt: paidAt || undefined,
        failureReason: failureReason || undefined,
      },
    });
  }

  /**
   * Get all payments (admin view)
   */
  async getAllPayments(filters: {
    status?: PaymentStatus;
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              department: true,
              user: { select: { email: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.offset,
        take: filters.limit || 50,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    const [total, paid, pending, failed] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    const revenue = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    const pendingRevenue = await prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    });

    return {
      total,
      paid,
      pending,
      failed,
      totalRevenue: revenue._sum.amount || 0,
      pendingRevenue: pendingRevenue._sum.amount || 0,
    };
  }

  /**
   * Get defaulters (students with pending payments)
   */
  async getDefaulters() {
    const studentsWithPending = await prisma.student.findMany({
      where: {
        payments: {
          some: {
            status: 'PENDING',
            dueDate: { lt: new Date() },
          },
        },
      },
      include: {
        user: {
          select: { email: true, phone: true },
        },
        bus: { select: { registrationNumber: true } },
        route: { select: { name: true } },
        payments: {
          where: {
            status: 'PENDING',
            dueDate: { lt: new Date() },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    return studentsWithPending.map(student => ({
      id: student.id,
      name: student.name,
      email: student.user.email,
      phone: student.user.phone,
      rollNumber: student.rollNumber,
      department: student.department,
      bus: student.bus?.registrationNumber,
      route: student.route?.name,
      pendingAmount: student.payments.reduce((sum, p) => sum + p.amount, 0),
      overdueCount: student.payments.length,
      oldestDueDate: student.payments[0]?.dueDate,
    }));
  }

  /**
   * Get payment by Razorpay payment ID
   */
  async getPaymentByRazorpayId(razorpayPaymentId: string) {
    return prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });
  }
}

export const paymentRepository = new PaymentRepository();

