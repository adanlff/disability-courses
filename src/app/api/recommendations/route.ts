import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/recommendations - Get personalized recommendations
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      // For non-authenticated users, return popular courses
      const courses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        take: 8,
        orderBy: [{ total_students: 'desc' }, { average_rating: 'desc' }],
        select: {
          id: true, title: true, slug: true, thumbnail: true,
          price: true, discount_price: true, is_free: true,
          average_rating: true, total_students: true,
          mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
          category: { select: { name: true, slug: true } },
        },
      });

      return NextResponse.json({ courses, type: 'popular' });
    }

    // Get user's enrolled courses categories
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: authUser.userId },
      include: { course: { select: { category_id: true, tags: true, level: true } } },
    });

    const enrolledCourseIds = enrollments.map(e => e.course_id);
    const categoryIds = Array.from(new Set(enrollments.map(e => e.course.category_id)));
    const allTags = Array.from(new Set(enrollments.flatMap(e => e.course.tags)));

    // Get recommended courses based on user interests
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: enrolledCourseIds },
        OR: [
          { category_id: { in: categoryIds } },
          { tags: { hasSome: allTags } },
        ],
      },
      take: 8,
      orderBy: [{ average_rating: 'desc' }, { total_students: 'desc' }],
      select: {
        id: true, title: true, slug: true, thumbnail: true,
        price: true, discount_price: true, is_free: true,
        average_rating: true, total_students: true,
        mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
        category: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({ courses, type: 'personalized' });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
