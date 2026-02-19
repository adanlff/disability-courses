// services/emailService.ts
import nodemailer from 'nodemailer';

// Get base URL - for emails we NEED absolute URLs
// In production: MUST set NEXT_PUBLIC_APP_URL environment variable
// In development: falls back to localhost:3000
function getBaseUrl(): string {
  // First check environment variables
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // For development only - in production, env var MUST be set
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Production without env var - return empty string (will be set at runtime)
  return '';
}

// Lazy initialization to avoid build-time errors
let _baseUrl: string | null = null;
function getLazyBaseUrl(): string {
  if (_baseUrl === null) {
    _baseUrl = getBaseUrl();
    if (!_baseUrl && process.env.NODE_ENV === 'production') {
      console.error('⚠️ WARNING: NEXT_PUBLIC_APP_URL is not set! Email links will not work correctly.');
    }
  }
  return _baseUrl;
}

// Konfigurasi SMTP dari environment variables (lazy loaded)
const getSMTPConfig = () => ({
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
});

// Expose BASE_URL as a getter that uses lazy loading
const get_BASE_URL = () => getLazyBaseUrl();

// Use Object.defineProperty to create a constant-like getter for backwards compatibility
// This allows existing code to use BASE_URL without changes
const BASE_URL = { toString: () => getLazyBaseUrl(), valueOf: () => getLazyBaseUrl() };

// Expose EMAIL_FROM as a getter function
const get_EMAIL_FROM = () => getSMTPConfig().EMAIL_FROM;

// Fungsi untuk membuat transporter secara lazy
function createTransporter(): nodemailer.Transporter {
  const config = getSMTPConfig();
  
  if (!config.SMTP_USER || !config.SMTP_PASSWORD) {
    console.error('❌ SMTP_USER atau SMTP_PASSWORD tidak dikonfigurasi!');
    console.error('📝 Tambahkan ke file .env:');
    console.error('   SMTP_USER=emailanda@gmail.com');
    console.error('   SMTP_PASSWORD=xxxx xxxx xxxx xxxx (App Password dari Google)');
    throw new Error('SMTP credentials not configured');
  }

  // Gunakan konfigurasi SMTP langsung dengan opsi TLS yang lebih permissive
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
    tls: {
      // Abaikan validasi sertifikat (untuk mengatasi proxy/antivirus)
      rejectUnauthorized: false
    }
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Template email dengan style dashboard mentor - Tanpa ikon
const createEmailTemplate = (content: string, title: string = '', footerText = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'E-Learning Platform'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f9fafb;
            color: #1A1A1A;
            line-height: 1.5;
        }
        
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .email-wrapper {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        
        .email-header {
            background: linear-gradient(135deg, #005EB8 0%, #003f7a 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
        }
        
        .email-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            color: white;
        }
        
        .email-header p {
            font-size: 16px;
            opacity: 0.9;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .email-content {
            padding: 32px 24px;
            background: #ffffff;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 16px;
        }
        
        .email-body {
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
        }
        
        /* Button Style Outline - seperti button Lihat Semua di dashboard */
        .email-button {
            display: inline-block;
            background: white;
            color: #005EB8;
            text-decoration: none;
            font-weight: 600;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            margin: 24px 0;
            border: 2px solid #005EB8;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .email-button:hover {
            background: #005EB8;
            color: white;
        }
        
        .email-button-success {
            background: white;
            color: #008A00;
            border: 2px solid #008A00;
        }
        
        .email-button-success:hover {
            background: #008A00;
            color: white;
        }
        
        .email-button-warning {
            background: white;
            color: #F4B400;
            border: 2px solid #F4B400;
        }
        
        .email-button-warning:hover {
            background: #F4B400;
            color: #1A1A1A;
        }
        
        .email-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        
        .email-card-title {
            font-size: 18px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 12px;
        }
        
        .email-info-box {
            background: #f0f9ff;
            border-left: 4px solid #005EB8;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }
        
        .email-warning-box {
            background: #fef3c7;
            border-left: 4px solid #F4B400;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }
        
        .email-success-box {
            background: #dcfce7;
            border-left: 4px solid #008A00;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }
        
        .email-danger-box {
            background: #fee2e2;
            border-left: 4px solid #D93025;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }
        
        .email-footer {
            background: #f3f4f6;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        
        .email-footer a {
            color: #005EB8;
            text-decoration: none;
        }
        
        .email-footer a:hover {
            text-decoration: underline;
        }
        
        .email-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 24px 0;
        }
        
        .email-list {
            list-style: none;
            padding: 0;
            margin: 16px 0;
        }
        
        .email-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .email-list li:before {
            content: "✓";
            color: #008A00;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .email-code {
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
            color: #1e3a8a;
            word-break: break-all;
            margin: 16px 0;
        }
        
        @media (max-width: 600px) {
            .email-container {
                padding: 10px;
            }
            
            .email-header {
                padding: 24px 16px;
            }
            
            .email-content {
                padding: 24px 16px;
            }
            
            .email-button {
                display: block;
                text-align: center;
                margin: 16px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-wrapper">
            <div class="email-header">
                <h1>E-Learning Platform</h1>
                <p>Tingkatkan Skill Anda Bersama Kami</p>
            </div>
            
            <div class="email-content">
                ${content}
            </div>
            
            <div class="email-footer">
                <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} E-Learning Platform. All rights reserved.</p>
                <p style="margin-bottom: 8px; color: #4b5563;">Jl. Pendidikan No. 123, Jakarta, Indonesia</p>
                ${footerText ? `<p style="margin-top: 12px; font-size: 13px; color: #9ca3af;">${footerText}</p>` : ''}
                <div class="email-divider"></div>
                <p style="font-size: 13px;">
                    Jika Anda memiliki pertanyaan, balas email ini atau kunjungi 
                    <a href="${BASE_URL}/help">pusat bantuan</a> kami.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Validasi email address
    if (!options.to || !/^\S+@\S+\.\S+$/.test(options.to)) {
      throw new Error(`Invalid email address: ${options.to}`);
    }

    // Buat transporter
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Learning Platform" <${get_EMAIL_FROM()}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    console.log(`📧 Attempting to send email to ${options.to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', {
      to: options.to,
      subject: options.subject,
      error: error.message || 'Unknown error',
    });
    
    // Throw error agar pemanggil tahu email gagal
    throw error;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const content = `
    <h2 class="email-title">Halo, ${name}!</h2>
    
    <div class="email-body">
      <p>Terima kasih telah mendaftar di E-Learning Platform. Silakan verifikasi alamat email Anda untuk mengaktifkan akun dan mulai menjelajahi berbagai kursus berkualitas.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" class="email-button email-button-success">
          Verifikasi Email Sekarang
        </a>
      </div>
      
      <p>Atau salin dan tempel link berikut ke browser Anda:</p>
      <div class="email-code">${verifyUrl}</div>
      
      <div class="email-warning-box">
        <p><strong>Perhatian:</strong> Link verifikasi ini akan kadaluarsa pada <strong>${expires}</strong>.</p>
        <p>Jika Anda tidak melakukan verifikasi dalam waktu 24 jam, Anda perlu meminta link verifikasi baru.</p>
      </div>
    </div>
  `;

  const html = createEmailTemplate(content, 'Verifikasi Email - E-Learning Platform', 'Jika Anda tidak mendaftar di platform kami, abaikan email ini.');

  return sendEmail({
    to: email,
    subject: 'Verifikasi Email Anda - E-Learning Platform',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  const expires = new Date(Date.now() + 60 * 60 * 1000).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const content = `
    <h2 class="email-title">Permintaan Reset Password</h2>
    
    <div class="email-body">
      <p>Halo <strong>${name}</strong>, kami menerima permintaan untuk mengatur ulang password akun Anda di E-Learning Platform.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="email-button email-button-warning">
          Reset Password Sekarang
        </a>
      </div>
      
      <p>Atau salin dan tempel link berikut ke browser Anda:</p>
      <div class="email-code">${resetUrl}</div>
      
      <div class="email-warning-box">
        <p><strong>Penting:</strong> Link reset password ini akan kadaluarsa pada <strong>${expires}</strong> (1 jam dari sekarang).</p>
      </div>
      
      <div class="email-info-box">
        <p><strong>Keamanan Akun:</strong> Jika Anda tidak meminta perubahan password, abaikan email ini dan pertimbangkan untuk mengamankan akun Anda. Keamanan akun Anda adalah prioritas utama kami.</p>
      </div>
    </div>
  `;

  const html = createEmailTemplate(content, 'Reset Password - E-Learning Platform', 'Jika Anda tidak meminta reset password, abaikan email ini.');

  return sendEmail({
    to: email,
    subject: 'Permintaan Reset Password - E-Learning Platform',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
    <h2 class="email-title">Selamat Datang di E-Learning Platform, ${name}!</h2>
    
    <div class="email-body">
      <p>Terima kasih telah bergabung bersama kami. Kami senang memiliki Anda sebagai bagian dari komunitas pembelajaran kami!</p>
      
      <p>Sekarang Anda dapat:</p>
      <ul class="email-list">
        <li>Jelajahi berbagai kursus berkualitas tinggi</li>
        <li>Belajar dari mentor berpengalaman</li>
        <li>Tingkatkan skill dan pengetahuan Anda</li>
        <li>Bergabung dengan komunitas pembelajar</li>
      </ul>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${BASE_URL}/courses" class="email-button">
          Jelajahi Kursus
        </a>
      </div>
      
      <div class="email-card">
        <h3 class="email-card-title">Mengapa Belajar di Platform Kami?</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
            <p style="font-weight: 600; color: #005EB8; margin-bottom: 4px;">Sertifikat Resmi</p>
            <p style="font-size: 14px;">Dapatkan sertifikat untuk setiap kursus yang diselesaikan</p>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
            <p style="font-weight: 600; color: #005EB8; margin-bottom: 4px;">Pembelajaran Fleksibel</p>
            <p style="font-size: 14px;">Belajar kapan saja dan di mana saja sesuai jadwal Anda</p>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
            <p style="font-weight: 600; color: #005EB8; margin-bottom: 4px;">Materi Berkualitas</p>
            <p style="font-size: 14px;">Konten terkurasi dari instruktur berpengalaman</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const html = createEmailTemplate(content, 'Selamat Datang - E-Learning Platform', 'Selamat belajar dan capai kesuksesan bersama kami!');

  return sendEmail({
    to: email,
    subject: 'Selamat Datang di E-Learning Platform!',
    html,
  });
}

export async function sendEnrollmentEmail(
  email: string,
  name: string,
  courseTitle: string,
  courseSlug: string
) {
  const courseUrl = `${BASE_URL}/courses/${courseSlug}`;
  
  const content = `
    <h2 class="email-title">Pendaftaran Berhasil!</h2>
    
    <div class="email-body">
      <p>Halo <strong>${name}</strong>, selamat! Anda telah berhasil mendaftar ke kursus:</p>
      
      <div class="email-card" style="text-align: center; background: linear-gradient(135deg, #005EB8 0%, #003f7a 100%); color: white;">
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: white;">${courseTitle}</h3>
        <p style="opacity: 0.9;">"Investasi terbaik adalah investasi pada diri sendiri"</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${courseUrl}" class="email-button">
          Mulai Belajar Sekarang
        </a>
      </div>
      
      <p>Kursus ini sekarang tersedia di dashboard pembelajaran Anda. Anda dapat mengaksesnya kapan saja dan belajar sesuai kecepatan Anda sendiri.</p>
      
      <div class="email-success-box">
        <p><strong>Tip Belajar:</strong> Luangkan waktu secara konsisten, selesaikan semua modul, dan jangan ragu untuk berinteraksi dengan mentor dan peserta lain melalui forum diskusi.</p>
      </div>
    </div>
  `;

  const html = createEmailTemplate(content, 'Pendaftaran Kursus - E-Learning Platform', 'Selamat belajar dan capai tujuan pembelajaran Anda!');

  return sendEmail({
    to: email,
    subject: `Pendaftaran Berhasil: ${courseTitle}`,
    html,
  });
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  courseTitle: string,
  certificateNumber: string
) {
  const certificateUrl = `${BASE_URL}/certificates/${certificateNumber}`;
  const issuedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const content = `
    <h2 class="email-title">Selamat, ${name}! 🎉</h2>
    
    <div class="email-body">
      <p>Kami dengan bangga mengumumkan bahwa Anda telah berhasil menyelesaikan kursus:</p>
      
      <div style="background: linear-gradient(135deg, #008A00 0%, #006600 100%); border-radius: 12px; padding: 32px 24px; text-align: center; color: white; margin: 24px 0;">
        <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: white;">${courseTitle}</h3>
        <div style="background: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 16px; display: inline-block; margin: 8px auto;">
          <p style="font-weight: 700; font-size: 18px; letter-spacing: 1px; margin: 0;">${certificateNumber}</p>
        </div>
        <p style="margin-top: 12px; opacity: 0.9; font-size: 14px;">Nomor Sertifikat Resmi</p>
        <p style="margin-top: 8px; font-size: 14px;">Diterbitkan: ${issuedDate}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${certificateUrl}" class="email-button email-button-success">
          Lihat & Unduh Sertifikat
        </a>
      </div>
      
      <div class="email-info-box">
        <p><strong>Bagikan Pencapaian Anda:</strong> Sertifikat ini dapat Anda bagikan di LinkedIn, CV, atau portofolio profesional Anda untuk meningkatkan kredibilitas dan peluang karier.</p>
      </div>
      
      <p>Teruslah belajar dan tingkatkan skill Anda! Pencapaian ini adalah bukti dedikasi dan kerja keras Anda dalam pembelajaran.</p>
    </div>
  `;

  const html = createEmailTemplate(content, 'Sertifikat Kelulusan - E-Learning Platform', 'Tetap semangat untuk terus belajar dan berkembang!');

  return sendEmail({
    to: email,
    subject: `Sertifikat Kelulusan: ${courseTitle}`,
    html,
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  courseTitle: string,
  amount: number,
  orderId: string
) {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  const paymentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const content = `
    <h2 class="email-title">Pembayaran Berhasil! ✅</h2>
    
    <div class="email-body">
      <p>Terima kasih, <strong>${name}</strong>! Pembayaran Anda telah berhasil diproses.</p>
      
      <div class="email-card">
        <h3 class="email-card-title">Detail Transaksi</h3>
        <div style="display: grid; gap: 12px; margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Order ID</span>
            <span style="font-weight: 600; color: #1A1A1A;">${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Kursus</span>
            <span style="font-weight: 600; color: #005EB8;">${courseTitle}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Jumlah Pembayaran</span>
            <span style="font-weight: 700; color: #008A00; font-size: 18px;">${formattedAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Tanggal Pembayaran</span>
            <span style="font-weight: 500; color: #1A1A1A;">${paymentDate}</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${BASE_URL}/dashboard/orders/${orderId}" class="email-button">
          Lihat Detail Transaksi
        </a>
      </div>
      
      <div class="email-success-box">
        <p><strong>Status:</strong> Pembayaran telah dikonfirmasi dan kursus siap diakses melalui dashboard pembelajaran Anda.</p>
      </div>
      
      <p>Invoice resmi telah dikirimkan ke email ini sebagai lampiran. Simpan dokumen ini untuk keperluan administrasi dan pencatatan keuangan Anda.</p>
    </div>
  `;

  const html = createEmailTemplate(content, 'Konfirmasi Pembayaran - E-Learning Platform', 'Terima kasih telah mempercayai platform pembelajaran kami.');

  return sendEmail({
    to: email,
    subject: `Konfirmasi Pembayaran - ${orderId}`,
    html,
  });
}

// Template khusus untuk mentor
export async function sendMentorApprovalEmail(
  email: string,
  name: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  const content = `
    <h2 class="email-title">Status Pendaftaran Mentor</h2>
    
    <div class="email-body">
      <p>Halo <strong>${name}</strong>,</p>
      
      ${status === 'APPROVED' ? `
        <div class="email-success-box">
          <p><strong>Selamat! Pendaftaran Anda sebagai mentor telah DISETUJUI.</strong></p>
          <p>Anda sekarang dapat mengakses dashboard mentor dan mulai membuat kursus di platform kami.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/mentor/dashboard" class="email-button">
            Akses Dashboard Mentor
          </a>
        </div>
        
        <div class="email-card">
          <h3 class="email-card-title">Langkah Selanjutnya</h3>
          <ol style="padding-left: 20px; margin: 16px 0;">
            <li style="margin-bottom: 8px;">Lengkapi profil mentor Anda</li>
            <li style="margin-bottom: 8px;">Buat kursus pertama Anda</li>
            <li style="margin-bottom: 8px;">Tentukan harga dan materi pembelajaran</li>
            <li>Publikasikan kursus dan mulai mengajar</li>
          </ol>
        </div>
      ` : `
        <div class="email-danger-box">
          <p><strong>Mohon maaf, pendaftaran Anda sebagai mentor belum dapat disetujui.</strong></p>
          ${reason ? `<p><strong>Alasan:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>Anda dapat memperbaiki aplikasi Anda dan mengajukan kembali setelah 30 hari.</p>
        
        <div class="email-info-box">
          <p><strong>Saran:</strong> Pastikan profil Anda lengkap, sertakan portofolio yang relevan, dan pastikan kualifikasi Anda sesuai dengan standar platform kami.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/mentor/apply" class="email-button">
            Pelajari Syarat Mentor
          </a>
        </div>
      `}
      
      <p>Jika Anda memiliki pertanyaan lebih lanjut, jangan ragu untuk menghubungi tim dukungan kami.</p>
    </div>
  `;

  const statusText = status === 'APPROVED' ? 'Disetujui' : 'Ditolak';
  const html = createEmailTemplate(content, `Status Mentor - ${statusText}`, 'Terima kasih atas minat Anda untuk bergabung sebagai mentor.');

  return sendEmail({
    to: email,
    subject: `Status Pendaftaran Mentor: ${statusText}`,
    html,
  });
}

export async function sendCoursePublishedEmail(
  email: string,
  name: string,
  courseTitle: string,
  courseSlug: string,
  status: 'PUBLISHED' | 'REJECTED'
) {
  const courseUrl = `${BASE_URL}/courses/${courseSlug}`;
  
  const content = `
    <h2 class="email-title">Status Publikasi Kursus</h2>
    
    <div class="email-body">
      <p>Halo Mentor <strong>${name}</strong>,</p>
      
      ${status === 'PUBLISHED' ? `
        <div class="email-success-box">
          <p><strong>Kursus Anda telah DIPUBLIKASIKAN!</strong></p>
          <p>Kursus <strong>"${courseTitle}"</strong> sekarang tersedia untuk siswa di platform kami.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${courseUrl}" class="email-button">
            Lihat Kursus
          </a>
          <a href="${BASE_URL}/mentor/dashboard" class="email-button" style="margin-left: 12px; background: white; color: #6b7280; border: 2px solid #6b7280;">
            Dashboard Mentor
          </a>
        </div>
        
        <div class="email-card">
          <h3 class="email-card-title">Tips untuk Kesuksesan Kursus</h3>
          <ul class="email-list">
            <li>Promosikan kursus Anda melalui media sosial</li>
            <li>Respon cepat pertanyaan dari calon siswa</li>
            <li>Perbarui konten secara berkala</li>
            <li>Berinteraksi dengan siswa melalui forum diskusi</li>
          </ul>
        </div>
      ` : `
        <div class="email-danger-box">
          <p><strong>Kursus Anda perlu REVISI</strong></p>
          <p>Kursus <strong>"${courseTitle}"</strong> memerlukan beberapa perbaikan sebelum dapat dipublikasikan.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${BASE_URL}/mentor/courses/edit/${courseSlug}" class="email-button">
            Edit Kursus
          </a>
        </div>
        
        <div class="email-info-box">
          <p><strong>Panduan Revisi:</strong></p>
          <ul style="margin-top: 8px;">
            <li style="margin-bottom: 4px;">Pastikan semua modul memiliki konten lengkap</li>
            <li style="margin-bottom: 4px;">Tambahkan thumbnail yang menarik</li>
            <li style="margin-bottom: 4px;">Periksa kualitas video dan audio</li>
            <li>Pastikan deskripsi kursus informatif dan menarik</li>
          </ul>
        </div>
      `}
      
      <p>Terima kasih telah berkontribusi untuk menciptakan konten pembelajaran berkualitas.</p>
    </div>
  `;

  const statusText = status === 'PUBLISHED' ? 'Dipublikasikan' : 'Perlu Revisi';
  const html = createEmailTemplate(content, `Publikasi Kursus - ${statusText}`, 'Terus berkarya dan inspirasi siswa melalui pembelajaran!');

  return sendEmail({
    to: email,
    subject: `Status Publikasi Kursus: ${courseTitle}`,
    html,
  });
}