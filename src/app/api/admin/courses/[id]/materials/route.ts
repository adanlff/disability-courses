import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/courses/[id]/materials - Get all materials for a course (admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              orderBy: { order: 'asc' },
              include: {
                video: {
                  select: {
                    id: true,
                    duration: true,
                    status: true,
                    thumbnail: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Flatten materials with section info
    const materials = course.sections.flatMap(section =>
      section.materials.map(material => ({
        ...material,
        section_title: section.title,
        section_order: section.order,
      }))
    );

    const totalMaterials = materials.length;
    const totalDuration = materials.reduce((sum, m) => sum + m.duration, 0);

    return NextResponse.json({
      course_id: course.id,
      course_title: course.title,
      sections: course.sections,
      materials,
      stats: {
        total_sections: course.sections.length,
        total_materials: totalMaterials,
        total_duration: totalDuration,
      },
    });
  } catch (error) {
    console.error('Get course materials error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
