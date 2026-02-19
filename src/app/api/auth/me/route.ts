import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return unauthorizedResponse('Token tidak valid atau sudah kadaluarsa');
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        disability_type: true,
        avatar_url: true,
        bio: true,
        phone: true,
        date_of_birth: true,
        address: true,
        city: true,
        email_verified: true,
        email_verified_at: true,
        last_login: true,
        created_at: true,
        updated_at: true,
        mentor_profile: {
          select: {
            id: true,
            expertise: true,
            experience: true,
            education: true,
            bio: true,
            headline: true,
            website: true,
            linkedin: true,
            twitter: true,
            portfolio: true,
            status: true,
            approved_at: true,
            total_students: true,
            total_courses: true,
            average_rating: true,
            total_reviews: true,
            total_revenue: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse('User tidak ditemukan');
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan' },
        { status: 403 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
