import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search/filters - Get available search filters
export async function GET() {
  try {
    const [categories, levels, priceRange] = await Promise.all([
      prisma.category.findMany({
        where: { is_active: true },
        select: { id: true, name: true, slug: true, _count: { select: { courses: { where: { status: 'PUBLISHED' } } } } },
        orderBy: { order: 'asc' },
      }),
      prisma.course.groupBy({
        by: ['level'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
      }),
      prisma.course.aggregate({
        where: { status: 'PUBLISHED' },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return NextResponse.json({
      categories,
      levels: levels.map(l => ({ level: l.level, count: l._count.id })),
      price_range: { min: priceRange._min.price || 0, max: priceRange._max.price || 0 },
    });
  } catch (error) {
    console.error('Get filters error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
