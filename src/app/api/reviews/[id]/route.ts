import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { updateReviewSchema } from '@/lib/validation';

interface RouteParams {
  params: { id: string };
}

// GET /api/reviews/[id] - Get review by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
        course: { select: { id: true, title: true } },
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

// PUT /api/reviews/[id] - Update review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    if (review.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: result.data,
    });

    // Update course average rating
    const avgResult = await prisma.review.aggregate({
      where: { course_id: review.course_id },
      _avg: { rating: true },
    });

    await prisma.course.update({
      where: { id: review.course_id },
      data: { average_rating: avgResult._avg.rating || 0 },
    });

    return NextResponse.json({ message: 'Review berhasil diperbarui', review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    if (review.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });

    // Update course average rating
    const avgResult = await prisma.review.aggregate({
      where: { course_id: review.course_id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.course.update({
      where: { id: review.course_id },
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
