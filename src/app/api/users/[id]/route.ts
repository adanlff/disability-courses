import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isSelf = authUser.userId === id;

    if (!isAdmin && !isSelf) return forbiddenResponse();

    const user = await prisma.user.findUnique({
      where: { id },
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
        mentor_profile: isAdmin ? {
          select: { id: true, status: true, expertise: true },
        } : false,
        _count: {
          select: { enrollments: true, certificates: true, reviews: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { id } = params;
    const body = await request.json();

    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: result.data,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        updated_at: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'UPDATE_USER',
        entity_type: 'user',
        entity_id: id,
      },
    });

    return NextResponse.json({ message: 'User berhasil diperbarui', user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { id } = params;

    if (id === authUser.userId) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'DELETE_USER',
        entity_type: 'user',
        entity_id: id,
      },
    });

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
