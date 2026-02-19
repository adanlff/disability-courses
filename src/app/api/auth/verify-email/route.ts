import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyEmailSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = verifyEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Find token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (verificationToken.used_at) {
      return NextResponse.json(
        { error: 'Token sudah digunakan' },
        { status: 400 }
      );
    }

    // Check token type
    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      );
    }

    // Update user and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.user_id },
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
        user_id: verificationToken.user_id,
        action: 'VERIFY_EMAIL',
        entity_type: 'user',
        entity_id: verificationToken.user_id,
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
