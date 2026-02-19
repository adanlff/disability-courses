import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/videos - List videos (mentor/admin only)
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    // If mentor, only show their videos
    if (!hasRole(authUser, [UserRole.ADMIN])) {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { user_id: authUser.userId },
        select: { id: true },
      });

      if (!mentorProfile) {
        return NextResponse.json({ videos: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }

      where.material = { section: { course: { mentor_id: mentorProfile.id } } };
    }

    if (status) where.status = status;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          material: {
            select: {
              id: true, title: true,
              section: { select: { course: { select: { id: true, title: true } } } },
            },
          },
          qualities: true,
        },
      }),
      prisma.video.count({ where }),
    ]);

    return NextResponse.json({
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
