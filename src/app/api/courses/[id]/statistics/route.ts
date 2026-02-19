import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/courses/[id]/statistics - Get course statistics
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find course and check ownership
    const course = await prisma.course.findUnique({
      where: { id },
      include: { mentor: { select: { user_id: true } } },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    const isMentor = course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get enrollment statistics
    const enrollmentStats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { course_id: id },
      _count: { id: true },
    });

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEnrollments = await prisma.enrollment.count({
      where: {
        course_id: id,
        created_at: { gte: thirtyDaysAgo },
      },
    });

    // Get review statistics
    const reviewStats = await prisma.review.aggregate({
      where: { course_id: id },
      _avg: { rating: true },
      _count: { id: true },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { course_id: id },
      _count: { rating: true },
    });

    // Get revenue (from transactions)
    const revenueStats = await prisma.transaction.aggregate({
      where: {
        course_id: id,
        status: 'PAID',
      },
      _sum: { total_amount: true },
      _count: { id: true },
    });

    // Get completion rate
    const totalEnrollments = await prisma.enrollment.count({
      where: { course_id: id },
    });

    const completedEnrollments = await prisma.enrollment.count({
      where: { course_id: id, status: 'COMPLETED' },
    });

    const completionRate = totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

    return NextResponse.json({
      overview: {
        total_students: course.total_students,
        total_reviews: course.total_reviews,
        average_rating: course.average_rating,
        total_views: course.total_views,
        completion_rate: completionRate.toFixed(1),
      },
      enrollments: {
        by_status: enrollmentStats,
        recent_30_days: recentEnrollments,
      },
      reviews: {
        average: reviewStats._avg.rating || 0,
        total: reviewStats._count.id,
        distribution: ratingDistribution,
      },
      revenue: {
        total: revenueStats._sum.total_amount || 0,
        transactions: revenueStats._count.id,
      },
    });
  } catch (error) {
    console.error('Get course statistics error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
