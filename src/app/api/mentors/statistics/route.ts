import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentors/statistics - Get mentor's statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const courses = await prisma.course.findMany({
      where: { mentor_id: mentorProfile.id },
      select: { id: true, status: true },
    });

    const courseIds = courses.map(c => c.id);

    const [totalEnrollments, totalReviews, totalRevenue] = await Promise.all([
      prisma.enrollment.count({ where: { course_id: { in: courseIds } } }),
      prisma.review.count({ where: { course_id: { in: courseIds } } }),
      prisma.transaction.aggregate({
        where: { course_id: { in: courseIds }, status: 'PAID' },
        _sum: { total_amount: true },
      }),
    ]);

    return NextResponse.json({
      total_courses: courses.length,
      published_courses: courses.filter(c => c.status === 'PUBLISHED').length,
      total_students: totalEnrollments,
      total_reviews: totalReviews,
      average_rating: mentorProfile.average_rating,
      total_revenue: totalRevenue._sum.total_amount || 0,
    });
  } catch (error) {
    console.error('Get mentor statistics error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
