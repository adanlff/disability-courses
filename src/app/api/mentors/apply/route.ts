import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { applyMentorSchema } from '@/lib/validation';
import { UserRole, MentorStatus } from '@prisma/client';

// POST /api/mentors/apply - Apply to become a mentor
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Check if already a mentor
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki profil mentor', profile: existingProfile },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Extract phone from body (it's for user table, not mentor profile)
    const { phone, ...applyData } = body;

    const result = applyMentorSchema.safeParse(applyData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const errorDetails = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
        .join('; ');
      return NextResponse.json(
        { error: `Validasi gagal: ${errorDetails}`, details: fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Create mentor profile
    const profile = await prisma.mentorProfile.create({
      data: {
        user_id: authUser.userId,
        expertise: data.expertise,
        experience: data.experience,
        education: data.education,
        bio: data.bio,
        headline: data.headline,
        website: data.website || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
        portfolio: data.portfolio || null,
        status: MentorStatus.PENDING,
      },
    });

    // Update user role to MENTOR and phone if provided
    await prisma.user.update({
      where: { id: authUser.userId },
      data: { 
        role: UserRole.MENTOR,
        ...(phone && { phone }),
      },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'APPLY_MENTOR',
        entity_type: 'mentor_profile',
        entity_id: profile.id,
      },
    });

    return NextResponse.json(
      { message: 'Pendaftaran mentor berhasil diajukan', profile },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
