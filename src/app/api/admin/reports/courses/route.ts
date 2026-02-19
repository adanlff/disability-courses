import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, CourseStatus, CourseLevel } from '@prisma/client';

// GET /api/admin/reports/courses - Course reports and analytics
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
      case 'day': dateFrom.setDate(now.getDate() - 1); break;
      case 'week': dateFrom.setDate(now.getDate() - 7); break;
      case 'month': dateFrom.setMonth(now.getMonth() - 1); break;
      case 'year': dateFrom.setFullYear(now.getFullYear() - 1); break;
    }

    // Get course statistics separately to avoid TypeScript issues
    const totalCourses = await prisma.course.count();
    const publishedCourses = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED } });
    const pendingCourses = await prisma.course.count({ where: { status: CourseStatus.PENDING_REVIEW } });
    const draftCourses = await prisma.course.count({ where: { status: CourseStatus.DRAFT } });
    const newCourses = await prisma.course.count({
      where: { created_at: { gte: dateFrom, lte: now } },
    });

    // Get top rated courses
    const topRatedCourses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { average_rating: 'desc' },
      take: 10,
      select: {
        id: true, title: true, average_rating: true, total_reviews: true,
        mentor: { select: { user: { select: { full_name: true } } } },
      },
    });

    // Get most enrolled courses
    const mostEnrolledCourses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { total_students: 'desc' },
      take: 10,
      select: {
        id: true, title: true, total_students: true, price: true, is_free: true,
        mentor: { select: { user: { select: { full_name: true } } } },
      },
    });

    // Get courses by level
    const beginnerCount = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED, level: CourseLevel.BEGINNER } });
    const intermediateCount = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED, level: CourseLevel.INTERMEDIATE } });
    const advancedCount = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED, level: CourseLevel.ADVANCED } });
    const allLevelsCount = await prisma.course.count({ where: { status: CourseStatus.PUBLISHED, level: CourseLevel.ALL_LEVELS } });

    // Get courses by category
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });

    const coursesByCategory: { category: string; count: number }[] = [];
    for (const cat of categories) {
      const count = await prisma.course.count({
        where: { status: CourseStatus.PUBLISHED, category_id: cat.id },
      });
      if (count > 0) {
        coursesByCategory.push({ category: cat.name, count });
      }
    }

    return NextResponse.json({
      period,
      date_range: { from: dateFrom, to: now },
      summary: {
        total: totalCourses,
        published: publishedCourses,
        pending: pendingCourses,
        draft: draftCourses,
        new_in_period: newCourses,
      },
      top_rated: topRatedCourses,
      most_enrolled: mostEnrolledCourses,
      by_category: coursesByCategory,
      by_level: [
        { level: 'BEGINNER', count: beginnerCount },
        { level: 'INTERMEDIATE', count: intermediateCount },
        { level: 'ADVANCED', count: advancedCount },
        { level: 'ALL_LEVELS', count: allLevelsCount },
      ],
    });
  } catch (error) {
    console.error('Get course reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
