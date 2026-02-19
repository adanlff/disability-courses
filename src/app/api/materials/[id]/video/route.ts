import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/materials/[id]/video - Get material video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authUser = getAuthUser(request);

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        section: true,
        video: { include: { qualities: true } },
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    if (!material.video) {
      return NextResponse.json({ error: 'Video tidak tersedia' }, { status: 404 });
    }

    // Check access
    let canAccess = material.is_free;
    if (authUser && !canAccess) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: material.section.course_id,
          },
        },
      });
      canAccess = !!enrollment;
    }

    if (!canAccess) {
      return NextResponse.json({ error: 'Akses video memerlukan pendaftaran' }, { status: 403 });
    }

    return NextResponse.json({ video: material.video });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
