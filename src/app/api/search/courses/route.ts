import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search/courses - Search courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const is_free = searchParams.get('is_free');
    const price_min = searchParams.get('price_min');
    const price_max = searchParams.get('price_max');
    const rating_min = searchParams.get('rating_min');
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { status: 'PUBLISHED' };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }

    if (category) where.category = { slug: category };
    if (level) where.level = level;
    if (is_free !== null) where.is_free = is_free === 'true';
    if (price_min) where.price = { ...((where.price as Record<string, unknown>) || {}), gte: parseFloat(price_min) };
    if (price_max) where.price = { ...((where.price as Record<string, unknown>) || {}), lte: parseFloat(price_max) };
    if (rating_min) where.average_rating = { gte: parseFloat(rating_min) };

    let orderBy: Record<string, string> = { created_at: 'desc' };
    if (sort === 'popular') orderBy = { total_students: 'desc' };
    else if (sort === 'rating') orderBy = { average_rating: 'desc' };
    else if (sort === 'price_low') orderBy = { price: 'asc' };
    else if (sort === 'price_high') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { created_at: 'desc' };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: limit, orderBy,
        include: {
          category: { select: { name: true, slug: true } },
          mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Search courses error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
