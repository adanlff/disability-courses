import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/materials/[id]/progress - Get material progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: { section: true },
    });

    if (!material) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: material.section.course_id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ progress: null, isEnrolled: false });
    }

    const progress = await prisma.progress.findUnique({
      where: {
        enrollment_id_material_id: {
          enrollment_id: enrollment.id,
          material_id: id,
        },
      },
    });

    return NextResponse.json({ progress, isEnrolled: true });
  } catch (error) {
    console.error('Get material progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
