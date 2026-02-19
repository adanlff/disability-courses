import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRandomToken } from '@/lib/auth';
import { resendVerificationSchema } from '@/lib/validation';
import { sendVerificationEmail } from '@/services/email.service';

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
        message: 'Jika email terdaftar dan belum diverifikasi, Anda akan menerima email verifikasi',
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        message: 'Email sudah diverifikasi',
      });
    }

    // Delete existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        user_id: user.id,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Create new token
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        user_id: user.id,
        token,
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

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.full_name, token);
      console.log(`✅ Resend verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send resend verification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Jika email terdaftar dan belum diverifikasi, Anda akan menerima email verifikasi',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
