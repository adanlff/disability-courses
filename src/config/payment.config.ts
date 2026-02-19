// Payment Configuration
export const paymentConfig = {
  // Payment gateway (Midtrans example)
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    merchantId: process.env.MIDTRANS_MERCHANT_ID || '',
  },
  
  // Supported payment methods
  methods: {
    E_WALLET: {
      enabled: true,
      providers: ['gopay', 'ovo', 'dana', 'shopeepay'],
    },
    VIRTUAL_ACCOUNT: {
      enabled: true,
      banks: ['bca', 'bni', 'bri', 'mandiri', 'permata'],
    },
    QRIS: {
      enabled: true,
    },
  },
  
  // Transaction settings
  transaction: {
    expiryDuration: 24 * 60 * 60, // 24 hours in seconds
    minAmount: 10000, // Minimum IDR 10,000
    maxAmount: 100000000, // Maximum IDR 100,000,000
  },
  
  // Webhook
  webhook: {
    verifySignature: process.env.PAYMENT_VERIFY_SIGNATURE === 'true',
  },
  
  // Revenue share (platform fee)
  platformFee: {
    percentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10'),
    minFee: parseFloat(process.env.PLATFORM_MIN_FEE || '1000'),
  },
};

export type PaymentConfig = typeof paymentConfig;
export default paymentConfig;
