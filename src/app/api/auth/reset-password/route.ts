import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordOTPSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'Kode OTP harus 6 digit').regex(/^\d{6}$/, 'Kode OTP harus berupa 6 angka'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = resetPasswordOTPSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp, password } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Find OTP token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        user_id: user.id,
        token: otp,
        type: 'PASSWORD_RESET',
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

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
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
        action: 'RESET_PASSWORD',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      message: 'Password berhasil direset',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
