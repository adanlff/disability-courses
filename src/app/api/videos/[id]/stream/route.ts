import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole, VideoQuality } from '@prisma/client';
import { readFile, stat } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/[id]/stream - Stream video with range support
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const quality = (searchParams.get('quality') as VideoQuality) || VideoQuality.Q720P;

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        qualities: { where: { quality } },
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

    // Check access
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

    // Get video file path
    const videoPath = video.qualities[0]?.path || video.path;
    const absolutePath = path.join(process.cwd(), videoPath.replace(/^\//, ''));

    try {
      const stats = await stat(absolutePath);
      const fileSize = stats.size;
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (!match) {
          return new NextResponse(null, { status: 416 });
        }

        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const fileBuffer = await readFile(absolutePath);
        const chunk = new Uint8Array(fileBuffer.subarray(start, end + 1));

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': 'video/mp4',
            'Cache-Control': 'no-cache',
          },
        });
      } else {
        const fileBuffer = await readFile(absolutePath);
        const data = new Uint8Array(fileBuffer);

        return new NextResponse(data, {
          status: 200,
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          },
        });
      }
    } catch {
      return NextResponse.json({ error: 'File video tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error('Stream video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
