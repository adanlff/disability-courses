import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resendVerificationSchema } from '@/lib/validation';
import { sendVerificationEmail } from '@/services/email.service';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = resendVerificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, full_name: true, email_verified: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Jika email terdaftar dan belum diverifikasi, Anda akan menerima kode OTP',
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ message: 'Email sudah diverifikasi' });
    }

    // Delete existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        user_id: user.id,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Create new 6-digit OTP with 5 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.verificationToken.create({
      data: {
        user_id: user.id,
        token: otp,
        type: 'EMAIL_VERIFICATION',
        expires_at: expiresAt,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'RESEND_VERIFICATION',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    // Send OTP verification email
    try {
      await sendVerificationEmail(user.email, user.full_name, otp);
      console.log(`✅ Resend verification OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send resend verification OTP email:', emailError);
    }

    return NextResponse.json({
      message: 'Kode OTP baru telah dikirim ke email Anda',
      email: user.email,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
