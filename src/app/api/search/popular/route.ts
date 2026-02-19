import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search/popular - Get popular searches
export async function GET() {
  try {
    const popularCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      take: 8,
      orderBy: [{ total_views: 'desc' }, { total_students: 'desc' }],
      select: { id: true, title: true, slug: true, tags: true },
    });

    const popularTags = popularCourses.flatMap(c => c.tags).filter((tag, i, arr) => arr.indexOf(tag) === i).slice(0, 10);

    return NextResponse.json({ popular_courses: popularCourses, popular_tags: popularTags });
  } catch (error) {
    console.error('Get popular searches error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
