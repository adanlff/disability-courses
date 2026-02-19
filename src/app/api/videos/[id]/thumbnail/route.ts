import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/[id]/thumbnail - Get video thumbnail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        thumbnail: true,
        material: {
          select: {
            is_free: true,
            section: {
              select: {
                course: {
                  select: {
                    id: true,
                    status: true,
                    mentor: { select: { user_id: true } },
                  },
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

    // Thumbnail can be accessed publicly for published courses
    // Or by authenticated users for preview
    if (!video.thumbnail) {
      // Return default thumbnail or placeholder
      return NextResponse.json({ 
        thumbnail_url: null,
        message: 'Thumbnail tidak tersedia' 
      });
    }

    // If it's a URL, return it directly
    if (video.thumbnail.startsWith('http')) {
      return NextResponse.json({ thumbnail_url: video.thumbnail });
    }

    // If it's a local file, serve it
    try {
      const absolutePath = path.join(process.cwd(), video.thumbnail.replace(/^\//, ''));
      const fileBuffer = await readFile(absolutePath);
      const data = new Uint8Array(fileBuffer);

      // Determine content type
      const ext = path.extname(video.thumbnail).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 
                         ext === '.webp' ? 'image/webp' : 'image/jpeg';

      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return NextResponse.json({ thumbnail_url: video.thumbnail });
    }
  } catch (error) {
    console.error('Get video thumbnail error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/videos/[id]/thumbnail - Upload/update video thumbnail
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
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

    if (!isAdmin && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { thumbnail_url, timestamp } = body;

    // Update thumbnail - either from URL or generate from video at timestamp
    const updatedVideo = await prisma.video.update({
      where: { id: params.id },
      data: { thumbnail: thumbnail_url },
    });

    return NextResponse.json({
      message: 'Thumbnail berhasil diperbarui',
      thumbnail: updatedVideo.thumbnail,
    });
  } catch (error) {
    console.error('Update video thumbnail error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
