import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentor/certificates - Get certificates for mentor's courses
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    // Get mentor profile with courses
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      include: {
        courses: {
          select: { id: true },
        },
      },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const courseIds = mentorProfile.courses.map((c: { id: string }) => c.id);

    // Get certificates for mentor's courses
    const certificates = await prisma.certificate.findMany({
      where: {
        course_id: { in: courseIds },
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Get mentor certificates error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
