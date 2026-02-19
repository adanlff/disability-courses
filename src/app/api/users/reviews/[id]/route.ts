import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/users/reviews/[id] - Get single review
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const review = await prisma.review.findFirst({
      where: { id: params.id, user_id: authUser.userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            mentor: { select: { user: { select: { full_name: true } } } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/users/reviews/[id] - Update review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existingReview = await prisma.review.findFirst({
      where: { id: params.id, user_id: authUser.userId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment, is_anonymous } = body;

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating harus antara 1-5' }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(rating && { rating }),
        ...(comment !== undefined && { comment }),
        ...(is_anonymous !== undefined && { is_anonymous }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            mentor: { select: { user: { select: { full_name: true } } } },
          },
        },
      },
    });

    // Update course average rating
    const avgResult = await prisma.review.aggregate({
      where: { course_id: existingReview.course_id },
      _avg: { rating: true },
    });

    await prisma.course.update({
      where: { id: existingReview.course_id },
      data: { average_rating: avgResult._avg.rating || 0 },
    });

    return NextResponse.json({ message: 'Review berhasil diperbarui', review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/users/reviews/[id] - Delete review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existingReview = await prisma.review.findFirst({
      where: { id: params.id, user_id: authUser.userId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id: params.id } });

    // Update course average rating
    const avgResult = await prisma.review.aggregate({
      where: { course_id: existingReview.course_id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.course.update({
      where: { id: existingReview.course_id },
      data: {
        average_rating: avgResult._avg.rating || 0,
        total_reviews: avgResult._count.rating,
      },
    });

    return NextResponse.json({ message: 'Review berhasil dihapus' });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
