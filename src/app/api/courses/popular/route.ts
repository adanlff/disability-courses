import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/courses/popular - Get popular courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: [
        { total_students: 'desc' },
        { average_rating: 'desc' },
      ],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        mentor: {
          select: {
            id: true,
            headline: true,
            user: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get popular courses error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
