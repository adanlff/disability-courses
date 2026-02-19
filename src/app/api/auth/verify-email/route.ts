import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const verifyEmailOTPSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'Kode OTP harus 6 digit').regex(/^\d{6}$/, 'Kode OTP harus berupa 6 angka'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = verifyEmailOTPSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email_verified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json({ message: 'Email sudah diverifikasi' });
    }

    // Find OTP token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        user_id: user.id,
        token: otp,
        type: 'EMAIL_VERIFICATION',
        used_at: null,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (verificationToken.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    // Update user and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          email_verified_at: new Date(),
        },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used_at: new Date() },
      }),
    ]);

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'VERIFY_EMAIL',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      message: 'Email berhasil diverifikasi',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
