import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/stats - Public platform statistics for landing page
export async function GET() {
  try {
    const [
      totalUsers,
      totalCourses,
      totalCertificates,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      // Count total students (users with STUDENT role)
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),
      // Count published courses
      prisma.course.count({
        where: { status: 'PUBLISHED' }
      }),
      // Count issued certificates
      prisma.certificate.count(),
      // Count total reviews
      prisma.review.count(),
      // Calculate average rating
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
    ]);

    return NextResponse.json({
      total_students: totalUsers,
      total_courses: totalCourses,
      total_certificates: totalCertificates,
      total_reviews: totalReviews,
      average_rating: averageRating._avg.rating || 0,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
