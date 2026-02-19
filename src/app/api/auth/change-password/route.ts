import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, comparePassword, hashPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    
    // Validate input
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { current_password, new_password } = result.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return unauthorizedResponse('User tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(current_password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password lama tidak sesuai' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'CHANGE_PASSWORD',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
