import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/analytics/events - Get analytics events (admin only)
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('event_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Use activity logs as analytics events
    const where: Record<string, unknown> = {};
    
    if (eventType) where.action = eventType;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) (where.created_at as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.created_at as Record<string, Date>).lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Aggregate by event type
    const eventCounts = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: startDate ? { created_at: { gte: new Date(startDate) } } : undefined,
      orderBy: { _count: { id: 'desc' } },
    });

    return NextResponse.json({
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: eventCounts.map(e => ({
        event_type: e.action,
        count: e._count.id,
      })),
    });
  } catch (error) {
    console.error('Get analytics events error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
