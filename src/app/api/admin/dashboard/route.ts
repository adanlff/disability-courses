import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/dashboard - Admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const [users, mentors, courses, revenue, recentEnrollments] = await Promise.all([
      prisma.user.count(),
      prisma.mentorProfile.count({ where: { status: 'APPROVED' } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.transaction.aggregate({
        where: { status: 'PAID' },
        _sum: { total_amount: true },
      }),
      prisma.enrollment.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { id: true } });
    const coursesByStatus = await prisma.course.groupBy({ by: ['status'], _count: { id: true } });

    return NextResponse.json({
      stats: {
        total_users: users,
        total_mentors: mentors,
        total_courses: courses,
        total_revenue: revenue._sum.total_amount || 0,
      },
      users_by_role: usersByRole,
      courses_by_status: coursesByStatus,
      recent_enrollments: recentEnrollments,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
