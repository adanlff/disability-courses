// Review Service
import prisma from '@/lib/prisma';
import { EnrollmentStatus } from '@prisma/client';

// Create review
export async function createReview(userId: string, courseId: string, data: {
  rating: number;
  comment?: string;
}) {
  // Check if user is enrolled and has made progress
  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });

  if (!enrollment) {
    throw new Error('Anda harus terdaftar di kursus ini untuk memberikan review');
  }

  if (enrollment.progress < 10) {
    throw new Error('Selesaikan minimal 10% kursus untuk memberikan review');
  }

  // Check if already reviewed
  const existingReview = await prisma.review.findFirst({
    where: { user_id: userId, course_id: courseId },
  });

  if (existingReview) {
    throw new Error('Anda sudah memberikan review untuk kursus ini');
  }

  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating harus antara 1-5');
  }

  const review = await prisma.review.create({
    data: {
      user_id: userId,
      course_id: courseId,
      rating: data.rating,
      comment: data.comment,
    },
    include: {
      user: { select: { full_name: true, avatar_url: true } },
    },
  });

  // Update course rating
  await updateCourseRating(courseId);

  return review;
}

// Update review
export async function updateReview(reviewId: string, userId: string, data: {
  rating?: number;
  comment?: string;
}) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new Error('Review tidak ditemukan');
  }

  if (review.user_id !== userId) {
    throw new Error('Tidak memiliki akses untuk mengubah review ini');
  }

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Rating harus antara 1-5');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      user: { select: { full_name: true, avatar_url: true } },
    },
  });

  // Update course rating
  await updateCourseRating(review.course_id);

  return updatedReview;
}

// Delete review
export async function deleteReview(reviewId: string, userId: string, isAdmin: boolean = false) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new Error('Review tidak ditemukan');
  }

  if (!isAdmin && review.user_id !== userId) {
    throw new Error('Tidak memiliki akses untuk menghapus review ini');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Update course rating
  await updateCourseRating(review.course_id);

  return { success: true };
}

// Get course reviews
export async function getCourseReviews(courseId: string, options: {
  page?: number;
  limit?: number;
  rating?: number;
} = {}) {
  const { page = 1, limit = 10, rating } = options;

  const where: { course_id: string; rating?: number } = { course_id: courseId };
  if (rating) where.rating = rating;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { full_name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  // Get rating distribution
  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { course_id: courseId },
    _count: true,
  });

  const distribution = [1, 2, 3, 4, 5].map(r => ({
    rating: r,
    count: ratingDistribution.find(d => d.rating === r)?._count || 0,
  }));

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    distribution,
  };
}

// Get user review for course
export async function getUserReview(userId: string, courseId: string) {
  return prisma.review.findFirst({
    where: { user_id: userId, course_id: courseId },
  });
}

// Update course rating after review changes
async function updateCourseRating(courseId: string) {
  const reviews = await prisma.review.findMany({
    where: { course_id: courseId },
    select: { rating: true },
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      average_rating: Math.round(averageRating * 10) / 10,
      total_reviews: totalReviews,
    },
  });
}

// Mark review as helpful
export async function markReviewHelpful(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { helpful_count: { increment: 1 } },
  });
}
