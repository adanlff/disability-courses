import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/mentors - List mentor applications
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (search) {
      where.user = { full_name: { contains: search, mode: 'insensitive' } };
    }

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, email: true, full_name: true, avatar_url: true, phone: true, created_at: true } },
          _count: { select: { courses: true } },
        },
      }),
      prisma.mentorProfile.count({ where }),
    ]);

    return NextResponse.json({
      mentors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
