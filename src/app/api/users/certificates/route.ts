import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/users/certificates - Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const certificates = await prisma.certificate.findMany({
      where: { user_id: authUser.userId },
      orderBy: { created_at: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            mentor: {
              select: {
                user: { select: { full_name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
