import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/courses/[id]/materials - Get all course materials
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authUser = getAuthUser(request);

    // Check if user is enrolled
    let isEnrolled = false;
    if (authUser) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    const sections = await prisma.section.findMany({
      where: { course_id: id },
      orderBy: { order: 'asc' },
      include: {
        materials: {
          orderBy: { order: 'asc' },
          include: {
            video: isEnrolled ? {
              select: {
                id: true,
                duration: true,
                thumbnail: true,
                status: true,
              },
            } : false,
            resources: isEnrolled ? {
              select: {
                id: true,
                title: true,
                file_type: true,
                file_size: true,
              },
            } : false,
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    });

    // If not enrolled, hide content for non-free materials
    if (!isEnrolled) {
      sections.forEach(section => {
        section.materials.forEach(material => {
          if (!material.is_free) {
            material.content = null;
            material.document_url = null;
          }
        });
      });
    }

    return NextResponse.json({ 
      sections,
      isEnrolled,
    });
  } catch (error) {
    console.error('Get materials error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
