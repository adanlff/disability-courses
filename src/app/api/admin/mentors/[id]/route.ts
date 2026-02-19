import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/mentors/[id] - Get mentor details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        courses: { select: { id: true, title: true, status: true } },
        _count: { select: { courses: true } },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ mentor });
  } catch (error) {
    console.error('Get mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/mentors/[id] - Delete mentor profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: params.id },
      include: { _count: { select: { courses: true } } },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor tidak ditemukan' }, { status: 404 });
    }

    if (mentor._count.courses > 0) {
      return NextResponse.json({ error: 'Tidak dapat menghapus mentor yang memiliki kursus' }, { status: 400 });
    }

    await prisma.mentorProfile.delete({ where: { id: params.id } });

    // Reset user role to STUDENT
    await prisma.user.update({
      where: { id: mentor.user_id },
      data: { role: UserRole.STUDENT },
    });

    return NextResponse.json({ message: 'Mentor berhasil dihapus' });
  } catch (error) {
    console.error('Delete mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
