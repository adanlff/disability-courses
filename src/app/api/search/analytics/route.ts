import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/search/analytics - Search analytics (admin)
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const [topCourses, topCategories] = await Promise.all([
      prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        take: 10,
        orderBy: { total_views: 'desc' },
        select: { id: true, title: true, total_views: true, total_students: true },
      }),
      prisma.category.findMany({
        where: { is_active: true },
        orderBy: { courses: { _count: 'desc' } },
        take: 5,
        include: { _count: { select: { courses: { where: { status: 'PUBLISHED' } } } } },
      }),
    ]);

    return NextResponse.json({ top_courses: topCourses, top_categories: topCategories });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
