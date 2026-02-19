import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/reports - Get platform reports
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (type === 'comment') where.action = 'REPORT_COMMENT';
    else if (type === 'review') where.action = 'REPORT_REVIEW';
    else where.action = { startsWith: 'REPORT_' };

    const [reports, total] = await Promise.all([
      prisma.activityLog.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, full_name: true, email: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
