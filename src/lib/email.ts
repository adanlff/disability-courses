// Email utilities
import { emailConfig } from '@/config/email.config';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, unknown>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Helper to get base URL for email links (must be absolute URL)
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  console.error('⚠️ NEXT_PUBLIC_APP_URL not set - email links will not work');
  return '';
}

// Generate email verification link
export function generateVerificationLink(token: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/verify-email?token=${token}`;
}

// Generate password reset link
export function generatePasswordResetLink(token: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/reset-password?token=${token}`;
}

// Send email (stub - integrate with actual email service)
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      });
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    // TODO: Integrate with actual email service (Nodemailer, SendGrid, etc.)
    // const transporter = nodemailer.createTransport(emailConfig.smtp);
    // const info = await transporter.sendMail({ ... });
    
    console.log('📧 Email sent to:', options.to);
    return { success: true, messageId: `msg-${Date.now()}` };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string): Promise<SendResult> {
  const verificationLink = generateVerificationLink(token);
  
  return sendEmail({
    to: email,
    subject: 'Verifikasi Email Anda',
    html: `
      <h1>Verifikasi Email</h1>
      <p>Klik link berikut untuk memverifikasi email Anda:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
    `,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string): Promise<SendResult> {
  const resetLink = generatePasswordResetLink(token);
  
  return sendEmail({
    to: email,
    subject: 'Reset Password',
    html: `
      <h1>Reset Password</h1>
      <p>Anda menerima email ini karena permintaan reset password.</p>
      <p>Klik link berikut untuk reset password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    `,
  });
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string): Promise<SendResult> {
  return sendEmail({
    to: email,
    subject: 'Selamat Datang di E-Learning Platform',
    html: `
      <h1>Selamat Datang, ${name}!</h1>
      <p>Terima kasih telah bergabung dengan platform kami.</p>
      <p>Mulai perjalanan belajar Anda sekarang!</p>
    `,
  });
}

// Send enrollment confirmation email
export async function sendEnrollmentEmail(email: string, courseName: string): Promise<SendResult> {
  return sendEmail({
    to: email,
    subject: `Berhasil Mendaftar: ${courseName}`,
    html: `
      <h1>Pendaftaran Berhasil!</h1>
      <p>Anda berhasil mendaftar di kursus: <strong>${courseName}</strong></p>
      <p>Selamat belajar!</p>
    `,
  });
}

// Send certificate email
export async function sendCertificateEmail(email: string, courseName: string, certificateUrl: string): Promise<SendResult> {
  return sendEmail({
    to: email,
    subject: `Sertifikat: ${courseName}`,
    html: `
      <h1>Selamat!</h1>
      <p>Anda telah menyelesaikan kursus: <strong>${courseName}</strong></p>
      <p>Sertifikat Anda dapat diunduh di: <a href="${certificateUrl}">${certificateUrl}</a></p>
    `,
  });
}
