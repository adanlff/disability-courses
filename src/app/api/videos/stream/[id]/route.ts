import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/stream/[id] - Stream video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        material: { include: { section: true } },
        qualities: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    // Check enrollment for non-free materials
    if (video.material && !video.material.is_free) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: video.material.section.course_id,
          },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Akses video memerlukan pendaftaran' }, { status: 403 });
      }
    }

    // Return video streaming info
    const defaultQuality = video.qualities.find(q => q.quality === 'Q720P') || video.qualities[0];

    // Convert file paths to API URLs
    const pathToUrl = (filePath: string) => {
      // If path starts with 'uploads/', convert to '/api/uploads/'
      if (filePath.startsWith('uploads/')) {
        return '/api/' + filePath;
      }
      // If path starts with 'uploads\\', convert to '/api/uploads/'
      if (filePath.startsWith('uploads\\')) {
        return '/api/' + filePath.replace(/\\/g, '/');
      }
      // Already a URL or other format
      return filePath;
    };

    return NextResponse.json({
      video_id: video.id,
      qualities: video.qualities.map(q => ({
        quality: q.quality,
        url: pathToUrl(q.path),
      })),
      default_quality: defaultQuality?.quality,
      default_url: defaultQuality ? pathToUrl(defaultQuality.path) : null,
    });
  } catch (error) {
    console.error('Stream video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
