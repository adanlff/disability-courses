import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole, VideoStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/[id]/status - Get video processing status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        processing_error: true,
        duration: true,
        created_at: true,
        updated_at: true,
        material: {
          select: {
            section: {
              select: {
                course: {
                  select: { mentor: { select: { user_id: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    // Check access - only mentor or admin can check status
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isMentor = video.material?.section?.course?.mentor?.user_id === authUser.userId;

    if (!isAdmin && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate progress based on status
    let progress = 0;
    switch (video.status) {
      case VideoStatus.UPLOADING: progress = 25; break;
      case VideoStatus.PROCESSING: progress = 50; break;
      case VideoStatus.COMPLETED: progress = 100; break;
      case VideoStatus.FAILED: progress = 0; break;
    }

    return NextResponse.json({
      video_id: video.id,
      status: video.status,
      progress,
      duration: video.duration,
      error: video.processing_error,
      created_at: video.created_at,
      updated_at: video.updated_at,
    });
  } catch (error) {
    console.error('Get video status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/videos/[id]/status - Update video status (admin/system only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, processing_error, duration } = body;

    const video = await prisma.video.update({
      where: { id: params.id },
      data: {
        status: status as VideoStatus,
        processing_error,
        duration,
      },
    });

    return NextResponse.json({
      message: 'Status video berhasil diperbarui',
      video,
    });
  } catch (error) {
    console.error('Update video status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
