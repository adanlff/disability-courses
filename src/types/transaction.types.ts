// Transaction Types
import { TransactionStatus, PaymentMethod } from '@prisma/client';

// Transaction data
export interface TransactionData {
  id: string;
  user_id: string;
  course_id: string;
  mentor_id: string;
  order_id: string;
  amount: number;
  platform_fee: number;
  mentor_revenue: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  paid_at: Date | null;
  expired_at: Date | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

// Transaction with relations
export interface TransactionWithRelations extends TransactionData {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
  mentor: {
    user: {
      full_name: string;
    };
  };
}

// Transaction create input
export interface TransactionCreateInput {
  course_id: string;
  payment_method: PaymentMethod;
}

// Transaction list item
export interface TransactionListItem {
  id: string;
  order_id: string;
  course_title: string;
  amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  created_at: Date;
  paid_at: Date | null;
}

// Transaction statistics
export interface TransactionStatistics {
  total_transactions: number;
  total_revenue: number;
  total_pending: number;
  total_paid: number;
  total_failed: number;
  this_month_revenue: number;
  last_month_revenue: number;
  growth_percentage: number;
}

// Mentor revenue
export interface MentorRevenue {
  total_revenue: number;
  pending_revenue: number;
  paid_revenue: number;
  this_month: number;
  last_month: number;
  transactions: TransactionListItem[];
}

// Payment method info
export interface PaymentMethodInfo {
  method: PaymentMethod;
  label: string;
  icon: string;
  enabled: boolean;
}

// Payment result
export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  order_id?: string;
  payment_url?: string;
  token?: string;
  expired_at?: Date;
  error?: string;
}

// Webhook data
export interface PaymentWebhookData {
  order_id: string;
  transaction_status: string;
  payment_type: string;
  gross_amount: string;
  transaction_time?: string;
  signature_key?: string;
}

// Revenue report item
export interface RevenueReportItem {
  date: string;
  revenue: number;
  transactions: number;
}

// Revenue summary
export interface RevenueSummary {
  total: number;
  average_daily: number;
  highest_day: {
    date: string;
    revenue: number;
  };
  by_payment_method: Record<PaymentMethod, number>;
}
