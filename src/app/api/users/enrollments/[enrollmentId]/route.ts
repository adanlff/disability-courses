import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { enrollmentId: string };
}

// GET /api/users/enrollments/[enrollmentId] - Get enrollment detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { enrollmentId } = params;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        user_id: authUser.userId,
      },
      include: {
        course: {
          include: {
            category: true,
            mentor: {
              include: {
                user: { select: { full_name: true, avatar_url: true } },
              },
            },
            sections: {
              orderBy: { order: 'asc' },
              include: {
                materials: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    duration: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
        certificate: true,
        progress_records: {
          include: {
            material: {
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    }

    // Calculate progress stats
    const totalMaterials = enrollment.course.sections.reduce(
      (sum, section) => sum + section.materials.length,
      0
    );
    const completedMaterials = enrollment.progress_records.filter((p) => p.is_completed).length;
    const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

    return NextResponse.json({
      success: true,
      enrollment: {
        ...enrollment,
        stats: {
          totalMaterials,
          completedMaterials,
          progressPercentage,
        },
      },
    });
  } catch (error) {
    console.error('Get enrollment detail error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail enrollment' }, { status: 500 });
  }
}
