import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/mentor/certificates/[id] - Get certificate detail for mentor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      include: {
        courses: { select: { id: true } },
      },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const courseIds = mentorProfile.courses.map((c: { id: string }) => c.id);

    // Get certificate - ensure it belongs to one of mentor's courses
    const certificate = await prisma.certificate.findFirst({
      where: {
        id: params.id,
        course_id: { in: courseIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Get mentor certificate detail error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
