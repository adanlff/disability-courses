// Email Configuration
export const emailConfig = {
  // SMTP Settings
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  // From address
  from: {
    name: process.env.EMAIL_FROM_NAME || 'E-Learning Platform',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
  },
  
  // Email templates
  templates: {
    verification: 'email-verification',
    passwordReset: 'password-reset',
    welcome: 'welcome',
    courseEnrollment: 'course-enrollment',
    certificateIssued: 'certificate-issued',
    paymentConfirmation: 'payment-confirmation',
  },
  
  // Token expiry
  tokenExpiry: {
    verification: 24 * 60 * 60 * 1000, // 24 hours
    passwordReset: 60 * 60 * 1000, // 1 hour
  },
  
  // Rate limiting for emails
  rateLimit: {
    maxPerHour: 10,
    maxPerDay: 50,
  },
};

export type EmailConfig = typeof emailConfig;
export default emailConfig;
