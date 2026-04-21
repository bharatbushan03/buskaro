/**
 * Payment Domain Types
 * 
 * Type definitions for bus fee payments.
 */

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusFeeStructure {
  id: string;
  routeId: string;
  amount: number;
  currency: string;
  academicYear: string;
  semester: number;
  description: string | null;
  dueDate: Date;
  lateFeePerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentLink {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface PaymentAnalytics {
  totalCollected: number;
  pendingAmount: number;
  collectionRate: number;
  paymentsByMethod: Record<PaymentMethod, number>;
}
