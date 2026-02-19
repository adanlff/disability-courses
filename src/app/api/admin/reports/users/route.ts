import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, UserStatus } from '@prisma/client';

// GET /api/admin/reports/users - User reports and analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range
    const now = new Date();
    let dateFrom = new Date();
    
    switch (period) {
      case 'week': dateFrom.setDate(now.getDate() - 7); break;
      case 'month': dateFrom.setMonth(now.getMonth() - 1); break;
      case 'quarter': dateFrom.setMonth(now.getMonth() - 3); break;
      case 'year': dateFrom.setFullYear(now.getFullYear() - 1); break;
    }

    // Get user statistics
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsers,
      adminCount,
      mentorCount,
      studentCount,
      recentLogins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      prisma.user.count({
        where: { created_at: { gte: dateFrom, lte: now } },
      }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { role: UserRole.MENTOR } }),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.user.count({
        where: { last_login: { gte: dateFrom } },
      }),
    ]);

    // Get top learners by enrollment count
    const enrollmentCounts = await prisma.enrollment.groupBy({
      by: ['user_id'],
      _count: true,
    });

    // Sort and take top 10
    const sortedEnrollments = enrollmentCounts
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

    const topUserIds = sortedEnrollments.map(e => e.user_id);
    const topUserDetails = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, full_name: true, email: true, avatar_url: true },
    });

    const userMap = new Map(topUserDetails.map(u => [u.id, u]));

    // Get new users for registration trend
    const newUsersList = await prisma.user.findMany({
      where: { created_at: { gte: dateFrom } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    });

    // Group registrations by day
    const dailyRegistrations = new Map<string, number>();
    newUsersList.forEach(u => {
      const day = u.created_at.toISOString().split('T')[0];
      const current = dailyRegistrations.get(day) || 0;
      dailyRegistrations.set(day, current + 1);
    });

    return NextResponse.json({
      period,
      date_range: { from: dateFrom, to: now },
      summary: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        new_in_period: newUsers,
        active_in_period: recentLogins,
      },
      by_role: [
        { role: 'ADMIN', count: adminCount },
        { role: 'MENTOR', count: mentorCount },
        { role: 'STUDENT', count: studentCount },
      ],
      registration_trend: Array.from(dailyRegistrations.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      top_learners: sortedEnrollments.map(e => ({
        user: userMap.get(e.user_id),
        enrollments: e._count,
      })),
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
