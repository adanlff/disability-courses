import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentors/courses - Get mentor's courses
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      select: { id: true },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      mentor_id: mentorProfile.id,
    };

    if (status) where.status = status;

    const courses = await prisma.course.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, reviews: true, sections: true } },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get mentor courses error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
