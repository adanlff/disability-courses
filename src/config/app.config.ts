// Application Configuration
export const appConfig = {
  name: 'E-Learning Platform',
  description: 'Platform pembelajaran online inklusif untuk semua',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
  
  // Feature flags
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    twoFactorAuth: process.env.ENABLE_2FA === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  
  // Session
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

export type AppConfig = typeof appConfig;
export default appConfig;
