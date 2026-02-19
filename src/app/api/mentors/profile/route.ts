import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { updateMentorProfileSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

// GET /api/mentors/profile - Get current mentor's profile
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            bio: true,
            phone: true,
          },
        },
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get mentor profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/mentors/profile - Update current mentor's profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract phone from body (it's for user table, not mentor profile)
    const body = await request.json();
    const { phone, ...mentorData } = body;

    const result = updateMentorProfileSchema.safeParse(mentorData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Update mentor profile
    const profile = await prisma.mentorProfile.update({
      where: { user_id: authUser.userId },
      data: result.data,
    });

    // Update phone in user table if provided
    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: authUser.userId },
        data: { phone: phone || null },
      });
    }

    return NextResponse.json({ message: 'Profil berhasil diperbarui', profile });
  } catch (error) {
    console.error('Update mentor profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
