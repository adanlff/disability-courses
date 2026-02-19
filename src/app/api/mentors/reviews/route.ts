import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentors/reviews - Get mentor's course reviews
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      select: { id: true },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { course: { mentor_id: mentorProfile.id } },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true, avatar_url: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.review.count({ where: { course: { mentor_id: mentorProfile.id } } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get mentor reviews error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
