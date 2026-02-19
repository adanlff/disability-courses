import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/recommendations/course/[id] - Get recommendations based on a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authUser = getAuthUser(request);

    const course = await prisma.course.findUnique({
      where: { id },
      select: { category_id: true, tags: true, level: true, mentor_id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Get user's enrolled courses
    let enrolledIds: string[] = [];
    if (authUser) {
      const enrollments = await prisma.enrollment.findMany({
        where: { user_id: authUser.userId },
        select: { course_id: true },
      });
      enrolledIds = enrollments.map(e => e.course_id);
    }

    const recommendations = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: [...enrolledIds, id] },
        OR: [
          { category_id: course.category_id },
          { tags: { hasSome: course.tags } },
          { mentor_id: course.mentor_id },
        ],
      },
      take: 6,
      orderBy: [{ average_rating: 'desc' }, { total_students: 'desc' }],
      select: {
        id: true, title: true, slug: true, thumbnail: true,
        price: true, discount_price: true, is_free: true,
        average_rating: true, total_students: true,
        mentor: { select: { user: { select: { full_name: true } } } },
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Get course recommendations error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
