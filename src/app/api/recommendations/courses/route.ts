import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { CourseStatus } from '@prisma/client';

// GET /api/recommendations/courses - Get recommended courses
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const excludeEnrolled = searchParams.get('exclude_enrolled') === 'true';

    let enrolledCourseIds: string[] = [];
    let preferredCategories: string[] = [];

    if (authUser) {
      // Get user's enrolled courses
      const enrollments = await prisma.enrollment.findMany({
        where: { user_id: authUser.userId },
        select: {
          course_id: true,
          course: { select: { category_id: true } },
        },
      });

      enrolledCourseIds = enrollments.map(e => e.course_id);
      
      // Get unique category IDs
      const categorySet = new Set<string>();
      enrollments.forEach(e => categorySet.add(e.course.category_id));
      preferredCategories = Array.from(categorySet);
    }

    // Build where clause
    const whereClause: { status: CourseStatus; id?: { notIn: string[] }; category_id?: { in: string[] } } = {
      status: CourseStatus.PUBLISHED,
    };

    if (excludeEnrolled && enrolledCourseIds.length > 0) {
      whereClause.id = { notIn: enrolledCourseIds };
    }

    // Prioritize user's preferred categories
    if (preferredCategories.length > 0) {
      whereClause.category_id = { in: preferredCategories };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: [
        { is_featured: 'desc' },
        { average_rating: 'desc' },
        { total_students: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        short_description: true,
        price: true,
        discount_price: true,
        is_free: true,
        level: true,
        average_rating: true,
        total_students: true,
        total_reviews: true,
        mentor: {
          select: { user: { select: { full_name: true, avatar_url: true } } },
        },
        category: { select: { name: true, slug: true } },
      },
    });

    // If not enough courses from preferred categories, get more general recommendations
    if (courses.length < limit && preferredCategories.length > 0) {
      const additionalCourses = await prisma.course.findMany({
        where: {
          status: CourseStatus.PUBLISHED,
          id: { notIn: [...enrolledCourseIds, ...courses.map(c => c.id)] },
        },
        orderBy: [
          { is_featured: 'desc' },
          { average_rating: 'desc' },
        ],
        take: limit - courses.length,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          short_description: true,
          price: true,
          discount_price: true,
          is_free: true,
          level: true,
          average_rating: true,
          total_students: true,
          total_reviews: true,
          mentor: {
            select: { user: { select: { full_name: true, avatar_url: true } } },
          },
          category: { select: { name: true, slug: true } },
        },
      });

      courses.push(...additionalCourses);
    }

    return NextResponse.json({
      courses,
      personalized: authUser !== null,
    });
  } catch (error) {
    console.error('Get recommended courses error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
