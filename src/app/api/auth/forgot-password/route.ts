import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRandomToken } from '@/lib/auth';
import { forgotPasswordSchema } from '@/lib/validation';
import { sendPasswordResetEmail } from '@/services/email.service';

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
        message: 'Jika email terdaftar, Anda akan menerima email untuk reset password',
      });
    }

    // Delete existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        user_id: user.id,
        type: 'PASSWORD_RESET',
      },
    });

    // Create new token
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        user_id: user.id,
        token,
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

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.full_name, token);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Jika email terdaftar, Anda akan menerima email untuk reset password',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
