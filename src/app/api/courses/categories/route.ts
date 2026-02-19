import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/courses/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include_courses = searchParams.get('include_courses') === 'true';

    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { is_active: true },
          select: { id: true, name: true, slug: true },
        },
        ...(include_courses && {
          courses: {
            where: { status: 'PUBLISHED' },
            take: 5,
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              price: true,
              average_rating: true,
            },
          },
        }),
        _count: {
          select: {
            courses: { where: { status: 'PUBLISHED' } },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
