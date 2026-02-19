import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/admin/courses/[id]/feature - Feature/unfeature course
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { is_featured: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.course.update({
      where: { id: params.id },
      data: { is_featured: !course.is_featured },
    });

    return NextResponse.json({
      message: updated.is_featured ? 'Kursus ditampilkan sebagai unggulan' : 'Kursus dihapus dari unggulan',
      course: updated,
    });
  } catch (error) {
    console.error('Feature course error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
