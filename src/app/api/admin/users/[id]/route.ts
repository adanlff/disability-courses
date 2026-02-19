import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/users/[id] - Get user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        mentor_profile: true,
        _count: { select: { enrollments: true, certificates: true, reviews: true, transactions: true } },
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

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ message: 'User berhasil diperbarui', user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    if (params.id === authUser.userId) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
