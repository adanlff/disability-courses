import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/courses/[id] - Get course details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        mentor: { include: { user: { select: { id: true, full_name: true, email: true } } } },
        category: true,
        sections: { include: { materials: true } },
        _count: { select: { enrollments: true, reviews: true, transactions: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    await prisma.course.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'DELETE_COURSE',
        entity_type: 'course',
        entity_id: params.id,
      },
    });

    return NextResponse.json({ message: 'Kursus berhasil dihapus' });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
