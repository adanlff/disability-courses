// Midtrans API Client for Next.js
// Documentation: https://docs.midtrans.com/

interface MidtransConfig {
  isProduction: boolean;
  serverKey: string;
  clientKey: string;
  merchantId: string;
}

interface TransactionDetails {
  order_id: string;
  gross_amount: number;
}

interface CustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
}

interface ItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
  category?: string;
}

interface CreateTransactionParams {
  transaction_details: TransactionDetails;
  customer_details: CustomerDetails;
  item_details: ItemDetail[];
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
}

interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
}

class MidtransClient {
  private config: MidtransConfig;
  private apiUrl: string;

  constructor() {
    this.config = {
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
      merchantId: process.env.MIDTRANS_MERCHANT_ID || '',
    };

    this.apiUrl = this.config.isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(this.config.serverKey + ':').toString('base64');
    return `Basic ${auth}`;
  }

  async createTransaction(params: CreateTransactionParams): Promise<MidtransTransactionResponse> {
    const response = await fetch(`${this.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_messages?.[0] || 'Failed to create Midtrans transaction');
    }

    return response.json();
  }

  async getTransactionStatus(orderId: string): Promise<MidtransNotification> {
    const statusUrl = this.config.isProduction
      ? `https://api.midtrans.com/v2/${orderId}/status`
      : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.status_message || 'Failed to get transaction status');
    }

    return response.json();
  }

  verifySignature(notification: MidtransNotification): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha512');
    const data = notification.order_id + notification.status_code + notification.gross_amount + this.config.serverKey;
    hash.update(data);
    const expectedSignature = hash.digest('hex');
    return expectedSignature === notification.signature_key;
  }

  getClientKey(): string {
    return this.config.clientKey;
  }

  isProduction(): boolean {
    return this.config.isProduction;
  }
}

// Singleton instance
const midtrans = new MidtransClient();

export default midtrans;
export type { 
  CreateTransactionParams, 
  MidtransTransactionResponse, 
  MidtransNotification,
  TransactionDetails,
  CustomerDetails,
  ItemDetail
};
