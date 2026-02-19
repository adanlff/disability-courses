import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/analytics - Get platform analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const [userStats, courseStats, revenueStats, enrollmentStats] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.course.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.transaction.aggregate({ where: { status: 'PAID' }, _sum: { total_amount: true }, _count: { id: true } }),
      prisma.enrollment.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    return NextResponse.json({
      users: userStats,
      courses: courseStats,
      revenue: { total: revenueStats._sum.total_amount || 0, count: revenueStats._count.id },
      enrollments: enrollmentStats,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
