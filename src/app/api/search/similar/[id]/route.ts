import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/search/similar/[id] - Get similar courses
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { category_id: true, tags: true, level: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    const similarCourses = await prisma.course.findMany({
      where: {
        id: { not: id },
        status: 'PUBLISHED',
        OR: [
          { category_id: course.category_id },
          { tags: { hasSome: course.tags } },
          { level: course.level },
        ],
      },
      take: 6,
      orderBy: [{ average_rating: 'desc' }, { total_students: 'desc' }],
      select: {
        id: true, title: true, slug: true, thumbnail: true, price: true, discount_price: true,
        average_rating: true, total_students: true,
        mentor: { select: { user: { select: { full_name: true } } } },
      },
    });

    return NextResponse.json({ similar_courses: similarCourses });
  } catch (error) {
    console.error('Get similar courses error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
