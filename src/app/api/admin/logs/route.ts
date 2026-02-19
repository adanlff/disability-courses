import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/logs - Get system activity logs
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    const entityType = searchParams.get('entity_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const where: Record<string, unknown> = {};
    
    if (action) where.action = action;
    if (userId) where.user_id = userId;
    if (entityType) where.entity_type = entityType;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) (where.created_at as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.created_at as Record<string, Date>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Get unique actions for filter dropdown
    const actions = await prisma.activityLog.findMany({
      select: { action: true },
      distinct: ['action'],
    });

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        actions: actions.map(a => a.action),
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
