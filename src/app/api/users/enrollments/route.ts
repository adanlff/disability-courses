import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/users/enrollments - Get user's enrollments with recalculated progress
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const recalculate = searchParams.get('recalculate') === 'true';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      user_id: authUser.userId,
    };

    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              total_duration: true,
              total_lectures: true,
              average_rating: true,
              level: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              mentor: {
                select: {
                  user: { select: { full_name: true, avatar_url: true } },
                },
              },
              sections: {
                select: {
                  id: true,
                  materials: {
                    select: { id: true },
                  },
                },
              },
            },
          },
          certificate: {
            select: {
              id: true,
              certificate_number: true,
              status: true,
              issued_at: true,
            },
          },
          progress_records: {
            select: {
              id: true,
              material_id: true,
              is_completed: true,
              watched_duration: true,
              last_position: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    // Recalculate progress for each enrollment based on actual progress_records
    const enrollmentsWithRecalculatedProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Calculate total materials from sections
        const totalMaterials = enrollment.course.sections.reduce(
          (sum, section) => sum + section.materials.length, 0
        );
        
        // Count completed materials from progress_records
        const completedMaterials = enrollment.progress_records.filter(
          (p) => p.is_completed
        ).length;
        
        // Calculate correct progress
        const calculatedProgress = totalMaterials > 0 
          ? Math.round((completedMaterials / totalMaterials) * 100)
          : 0;
        
        // If progress is different and recalculate is enabled, update the database
        if (recalculate && enrollment.progress !== calculatedProgress) {
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              progress: calculatedProgress,
              status: calculatedProgress >= 100 ? 'COMPLETED' : enrollment.status === 'COMPLETED' && calculatedProgress < 100 ? 'ACTIVE' : enrollment.status,
              completed_at: calculatedProgress >= 100 ? (enrollment.completed_at || new Date()) : null,
            },
          });
        }

        // Return enrollment with calculated progress (always use fresh calculation)
        const { sections, ...courseWithoutSections } = enrollment.course;
        return {
          ...enrollment,
          progress: calculatedProgress, // Always return the calculated progress
          course: courseWithoutSections,
          _count: {
            total_materials: totalMaterials,
            completed_materials: completedMaterials,
          },
        };
      })
    );

    return NextResponse.json({
      enrollments: enrollmentsWithRecalculatedProgress,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
