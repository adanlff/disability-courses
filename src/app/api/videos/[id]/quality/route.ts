import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/[id]/quality - Get available video qualities
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        qualities: {
          orderBy: { quality: 'asc' },
        },
        material: {
          include: {
            section: {
              include: {
                course: { include: { mentor: true } },
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    // Check access - enrolled user, mentor, or admin
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isMentor = video.material?.section?.course?.mentor?.user_id === authUser.userId;
    
    let isEnrolled = false;
    if (video.material?.section?.course) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: video.material.section.course.id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    if (!isAdmin && !isMentor && !isEnrolled) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      video_id: video.id,
      qualities: video.qualities.map(q => ({
        id: q.id,
        quality: q.quality,
        resolution: q.resolution,
        bitrate: q.bitrate,
        size: q.size,
      })),
      current_status: video.status,
    });
  } catch (error) {
    console.error('Get video qualities error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
