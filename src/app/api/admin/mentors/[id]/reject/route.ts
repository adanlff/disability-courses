import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, MentorStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/admin/mentors/[id]/reject - Reject mentor
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { reason } = body;

    const mentor = await prisma.mentorProfile.update({
      where: { id: params.id },
      data: {
        status: MentorStatus.REJECTED,
        rejection_reason: reason || 'Pendaftaran tidak memenuhi kriteria',
      },
    });

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'REJECT_MENTOR',
        entity_type: 'mentor_profile',
        entity_id: params.id,
        metadata: { reason },
      },
    });

    return NextResponse.json({ message: 'Mentor berhasil ditolak', mentor });
  } catch (error) {
    console.error('Reject mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
