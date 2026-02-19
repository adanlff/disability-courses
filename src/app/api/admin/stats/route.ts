import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalCourses,
      activeCourses,
      totalEnrollments,
      newEnrollments,
      totalRevenue,
      recentRevenue,
      usersByRole,
      enrollmentsByDay,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { gte: startDate } } }),
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { created_at: { gte: startDate } } }),
      prisma.transaction.aggregate({ where: { status: 'PAID' }, _sum: { total_amount: true } }),
      prisma.transaction.aggregate({ where: { status: 'PAID', paid_at: { gte: startDate } }, _sum: { total_amount: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.enrollment.groupBy({
        by: ['created_at'],
        where: { created_at: { gte: startDate } },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      overview: {
        total_users: totalUsers,
        new_users: newUsers,
        total_courses: totalCourses,
        active_courses: activeCourses,
        total_enrollments: totalEnrollments,
        new_enrollments: newEnrollments,
        total_revenue: totalRevenue._sum.total_amount || 0,
        recent_revenue: recentRevenue._sum.total_amount || 0,
      },
      users_by_role: usersByRole,
      enrollments_trend: enrollmentsByDay,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
