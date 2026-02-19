import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/activity - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (action) where.action = action;
    if (userId) where.user_id = userId;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, full_name: true, email: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
