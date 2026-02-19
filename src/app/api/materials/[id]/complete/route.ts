import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// POST /api/materials/[id]/complete - Mark material as complete
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: 'Anda belum terdaftar di kursus ini' }, { status: 403 });
    }

    const progress = await prisma.progress.upsert({
      where: {
        enrollment_id_material_id: {
          enrollment_id: enrollment.id,
          material_id: id,
        },
      },
      update: {
        is_completed: true,
        completed_at: new Date(),
      },
      create: {
        enrollment_id: enrollment.id,
        material_id: id,
        user_id: authUser.userId,
        is_completed: true,
        completed_at: new Date(),
      },
    });

    // Recalculate enrollment progress
    const course = await prisma.course.findUnique({
      where: { id: material.section.course_id },
      include: { sections: { include: { materials: true } } },
    });

    if (course) {
      const totalMaterials = course.sections.reduce((sum, s) => sum + s.materials.length, 0);
      const completedMaterials = await prisma.progress.count({
        where: { enrollment_id: enrollment.id, is_completed: true },
      });

      const progressPercent = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: progressPercent,
          last_accessed_at: new Date(),
          ...(progressPercent >= 100 && { status: 'COMPLETED', completed_at: new Date() }),
        },
      });
    }

    return NextResponse.json({ message: 'Materi ditandai selesai', progress });
  } catch (error) {
    console.error('Complete material error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
