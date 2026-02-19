import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        title: { contains: q, mode: 'insensitive' },
      },
      take: 5,
      select: { id: true, title: true, slug: true },
    });

    const categories = await prisma.category.findMany({
      where: {
        is_active: true,
        name: { contains: q, mode: 'insensitive' },
      },
      take: 3,
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      suggestions: [
        ...courses.map(c => ({ type: 'course', ...c })),
        ...categories.map(c => ({ type: 'category', ...c })),
      ],
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
