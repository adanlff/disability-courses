import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { createCourseSchema } from '@/lib/validation';
import { CourseStatus, UserRole } from '@prisma/client';

// GET /api/courses - List all published courses (public) or all courses (admin/mentor)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search') || searchParams.get('q');
    const is_free = searchParams.get('is_free');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;
    const authUser = getAuthUser(request);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Only show published courses to public users, all courses to admin
    if (!authUser || !hasRole(authUser, [UserRole.ADMIN])) {
      where.status = CourseStatus.PUBLISHED;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (level) {
      where.level = level;
    }

    if (is_free !== null && is_free !== undefined) {
      where.is_free = is_free === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'popular':
        orderBy = { total_students: 'desc' };
        break;
      case 'rating':
        orderBy = { average_rating: 'desc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          mentor: {
            select: {
              id: true,
              headline: true,
              average_rating: true,
              user: {
                select: { id: true, full_name: true, avatar_url: true },
              },
            },
          },
          _count: {
            select: {
              sections: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (mentor only)
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Profil mentor tidak ditemukan' },
        { status: 400 }
      );
    }

    if (mentorProfile.status !== 'APPROVED' && authUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Profil mentor belum disetujui' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const result = createCourseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Generate slug
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug exists
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        mentor_id: mentorProfile.id,
        title: data.title,
        slug,
        description: data.description,
        short_description: data.short_description,
        thumbnail: data.thumbnail, // Add thumbnail URL
        category_id: data.category_id,
        level: data.level,
        language: data.language,
        price: data.price,
        discount_price: data.discount_price,
        is_free: data.is_free,
        is_premium: data.is_premium,
        requirements: data.requirements,
        what_you_will_learn: data.what_you_will_learn,
        target_audience: data.target_audience,
        tags: data.tags,
        status: CourseStatus.DRAFT,
      },
      include: {
        category: true,
        mentor: {
          include: {
            user: { select: { full_name: true } },
          },
        },
      },
    });

    // Update mentor total courses
    await prisma.mentorProfile.update({
      where: { id: mentorProfile.id },
      data: { total_courses: { increment: 1 } },
    });

    return NextResponse.json(
      { message: 'Kursus berhasil dibuat', course },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
