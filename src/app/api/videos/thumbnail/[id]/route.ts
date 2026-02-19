import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/thumbnail/[id] - Get video thumbnail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      select: { thumbnail: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    if (!video.thumbnail) {
      return NextResponse.json({ error: 'Thumbnail tidak tersedia' }, { status: 404 });
    }

    return NextResponse.json({ thumbnail: video.thumbnail });
  } catch (error) {
    console.error('Get thumbnail error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
