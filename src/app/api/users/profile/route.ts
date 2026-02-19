import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validation';

// GET /api/users/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        disability_type: true,
        avatar_url: true,
        bio: true,
        phone: true,
        date_of_birth: true,
        address: true,
        city: true,
        email_verified: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/users/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();

    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Convert date_of_birth string to Date if provided
    const updateData: Record<string, unknown> = { ...data };
    if (data.date_of_birth) {
      updateData.date_of_birth = new Date(data.date_of_birth);
    }

    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        full_name: true,
        disability_type: true,
        avatar_url: true,
        bio: true,
        phone: true,
        date_of_birth: true,
        address: true,
        city: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ message: 'Profil berhasil diperbarui', user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
