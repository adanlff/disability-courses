import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, comparePassword, hashPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';

// PUT /api/users/profile/password - Update password
export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();

    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { current_password, new_password } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const isValid = await comparePassword(current_password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(new_password);

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { password: hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'CHANGE_PASSWORD',
        entity_type: 'user',
        entity_id: authUser.userId,
      },
    });

    return NextResponse.json({ message: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
