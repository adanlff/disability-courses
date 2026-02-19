import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { createReviewSchema } from '@/lib/validation';

interface RouteParams {
  params: { id: string };
}

// GET /api/courses/[id]/reviews - Get course reviews
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;

    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'helpful':
        orderBy = { helpful_count: 'desc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { course_id: id },
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { course_id: id } }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { course_id: id },
      _count: { rating: true },
    });

    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    ratingDistribution.forEach(item => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    return NextResponse.json({
      reviews,
      distribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/reviews - Create a review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { id } = params;

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Anda harus terdaftar di kursus ini untuk memberikan review' },
        { status: 403 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan review untuk kursus ini' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const result = createReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Create review
    const review = await prisma.review.create({
      data: {
        user_id: authUser.userId,
        course_id: id,
        rating: data.rating,
        comment: data.comment,
        is_anonymous: data.is_anonymous,
      },
      include: {
        user: {
          select: { id: true, full_name: true, avatar_url: true },
        },
      },
    });

    // Update course average rating
    const avgResult = await prisma.review.aggregate({
      where: { course_id: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.course.update({
      where: { id },
      data: {
        average_rating: avgResult._avg.rating || 0,
        total_reviews: avgResult._count.rating,
      },
    });

    // Update mentor average rating
    const course = await prisma.course.findUnique({
      where: { id },
      select: { mentor_id: true },
    });

    if (course) {
      const mentorAvg = await prisma.review.aggregate({
        where: { course: { mentor_id: course.mentor_id } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.mentorProfile.update({
        where: { id: course.mentor_id },
        data: {
          average_rating: mentorAvg._avg.rating || 0,
          total_reviews: mentorAvg._count.rating,
        },
      });
    }

    return NextResponse.json(
      { message: 'Review berhasil ditambahkan', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
