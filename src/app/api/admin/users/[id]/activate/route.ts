import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, UserStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/admin/users/[id]/activate - Activate user
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { status: UserStatus.ACTIVE },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'ACTIVATE_USER',
        entity_type: 'user',
        entity_id: params.id,
      },
    });

    return NextResponse.json({ message: 'User berhasil diaktifkan', user });
  } catch (error) {
    console.error('Activate user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
