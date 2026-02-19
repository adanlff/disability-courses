import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/recommendations/personalized - Get user-specific recommendations
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: authUser.userId },
      include: { course: { select: { category_id: true, tags: true, level: true } } },
    });

    const enrolledIds = enrollments.map(e => e.course_id);
    const categoryIds = Array.from(new Set(enrollments.map(e => e.course.category_id)));
    const allTags = Array.from(new Set(enrollments.flatMap(e => e.course.tags)));
    const levels = Array.from(new Set(enrollments.map(e => e.course.level)));

    // Get wishlist courses
    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: authUser.userId },
      select: { course_id: true },
    });
    const wishlistIds = wishlist.map(w => w.course_id);

    // Build recommendations
    const recommendations = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: [...enrolledIds, ...wishlistIds] },
        OR: [
          { category_id: { in: categoryIds } },
          { tags: { hasSome: allTags } },
          { level: { in: levels } },
        ],
      },
      take: 10,
      orderBy: [{ average_rating: 'desc' }, { total_students: 'desc' }],
      select: {
        id: true, title: true, slug: true, thumbnail: true,
        price: true, discount_price: true, is_free: true,
        average_rating: true, total_students: true, level: true,
        mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
        category: { select: { name: true, slug: true } },
      },
    });

    // Continue learning
    const continueLearning = enrollments
      .filter(e => e.status === 'ACTIVE' && e.progress < 100)
      .sort((a, b) => new Date(b.last_accessed_at || 0).getTime() - new Date(a.last_accessed_at || 0).getTime())
      .slice(0, 4);

    return NextResponse.json({
      recommendations,
      continue_learning: continueLearning.map(e => ({
        enrollment_id: e.id,
        course_id: e.course_id,
        progress: e.progress,
      })),
    });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
