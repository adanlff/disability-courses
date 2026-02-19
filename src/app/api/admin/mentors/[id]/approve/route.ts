import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, MentorStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/admin/mentors/[id]/approve - Approve mentor
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const mentor = await prisma.mentorProfile.update({
      where: { id: params.id },
      data: {
        status: MentorStatus.APPROVED,
        approved_at: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'APPROVE_MENTOR',
        entity_type: 'mentor_profile',
        entity_id: params.id,
      },
    });

    return NextResponse.json({ message: 'Mentor berhasil disetujui', mentor });
  } catch (error) {
    console.error('Approve mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
