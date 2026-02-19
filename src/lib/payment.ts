// Payment utilities
import { paymentConfig } from '@/config/payment.config';
import { PaymentMethod, TransactionStatus } from '@prisma/client';

interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  itemDetails: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  token?: string;
  expiredAt?: Date;
  error?: string;
}

interface WebhookPayload {
  order_id: string;
  transaction_status: string;
  payment_type: string;
  gross_amount: string;
  signature_key?: string;
}

// Generate order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  const { percentage, minFee } = paymentConfig.platformFee;
  const fee = (amount * percentage) / 100;
  return Math.max(fee, minFee);
}

// Calculate mentor revenue
export function calculateMentorRevenue(amount: number): number {
  const platformFee = calculatePlatformFee(amount);
  return amount - platformFee;
}

// Create payment (stub - integrate with actual payment gateway)
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
  try {
    // In development, simulate payment
    if (process.env.NODE_ENV === 'development') {
      console.log('💳 Payment request:', request);
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        paymentUrl: `/payment/simulate?order_id=${request.orderId}`,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    // TODO: Integrate with Midtrans or other payment gateway
    // const midtrans = new MidtransClient.Snap({
    //   isProduction: paymentConfig.midtrans.isProduction,
    //   serverKey: paymentConfig.midtrans.serverKey,
    //   clientKey: paymentConfig.midtrans.clientKey,
    // });
    
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      paymentUrl: '#',
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error('Create payment error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Verify webhook signature
export function verifyWebhookSignature(payload: WebhookPayload): boolean {
  if (!paymentConfig.webhook.verifySignature) return true;
  
  // TODO: Implement actual signature verification
  // const serverKey = paymentConfig.midtrans.serverKey;
  // const hash = crypto.createHash('sha512')
  //   .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
  //   .digest('hex');
  // return hash === payload.signature_key;
  
  return true;
}

// Map payment gateway status to our status
export function mapPaymentStatus(gatewayStatus: string): TransactionStatus {
  const statusMap: Record<string, TransactionStatus> = {
    'capture': TransactionStatus.PAID,
    'settlement': TransactionStatus.PAID,
    'pending': TransactionStatus.PENDING,
    'deny': TransactionStatus.FAILED,
    'cancel': TransactionStatus.CANCELLED,
    'expire': TransactionStatus.FAILED,
    'failure': TransactionStatus.FAILED,
  };
  
  return statusMap[gatewayStatus.toLowerCase()] || TransactionStatus.PENDING;
}

// Format currency (Indonesian Rupiah)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Check if amount is valid
export function isValidAmount(amount: number): boolean {
  const { minAmount, maxAmount } = paymentConfig.transaction;
  return amount >= minAmount && amount <= maxAmount;
}
