import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validation';
import { sendPasswordResetEmail } from '@/services/email.service';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
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
      select: { id: true, email: true, full_name: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Jika email terdaftar, Anda akan menerima kode OTP untuk reset password',
      });
    }

    // Delete existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        user_id: user.id,
        type: 'PASSWORD_RESET',
      },
    });

    // Create new 6-digit OTP with 5 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.verificationToken.create({
      data: {
        user_id: user.id,
        token: otp,
        type: 'PASSWORD_RESET',
        expires_at: expiresAt,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'FORGOT_PASSWORD',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        metadata: { email },
      },
    });

    // Send OTP email
    try {
      await sendPasswordResetEmail(user.email, user.full_name, otp);
      console.log(`✅ Password reset OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset OTP email:', emailError);
    }

    return NextResponse.json({
      message: 'Kode OTP telah dikirim ke email Anda',
      email: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
