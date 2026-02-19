// Streaming Service
import { readFile, stat } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { VideoQuality } from '@prisma/client';

export interface StreamingOptions {
  quality?: string;
  start?: number;
  end?: number;
}

// Get video stream
export async function getVideoStream(
  videoId: string,
  options: StreamingOptions = {}
) {
  const { quality, start, end } = options;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      qualities: quality ? { where: { quality: quality as VideoQuality } } : true,
    },
  });

  if (!video) {
    return { error: 'Video tidak ditemukan' };
  }

  // Get appropriate video path
  let videoPath = video.path;
  if (quality && video.qualities.length > 0) {
    videoPath = video.qualities[0].path;
  }

  const absolutePath = path.join(process.cwd(), videoPath.replace(/^\//, ''));

  try {
    const stats = await stat(absolutePath);
    const fileSize = stats.size;

    const rangeStart = start || 0;
    const rangeEnd = end || fileSize - 1;
    const chunkSize = rangeEnd - rangeStart + 1;

    const fileBuffer = await readFile(absolutePath);
    const chunk = new Uint8Array(fileBuffer.subarray(rangeStart, rangeEnd + 1));

    return {
      data: chunk,
      fileSize,
      chunkSize,
      start: rangeStart,
      end: rangeEnd,
      contentType: 'video/mp4',
    };
  } catch {
    return { error: 'File video tidak ditemukan' };
  }
}

// Parse range header
export function parseRangeHeader(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader) {
    return { start: 0, end: fileSize - 1 };
  }

  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) {
    return { start: 0, end: fileSize - 1 };
  }

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  return { start, end };
}

// Get streaming headers
export function getStreamingHeaders(
  fileSize: number,
  start: number,
  end: number,
  isPartial: boolean = false
) {
  const headers: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Length': (end - start + 1).toString(),
    'Content-Type': 'video/mp4',
    'Cache-Control': 'no-cache',
  };

  if (isPartial) {
    headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
  }

  return headers;
}

// Track video view
export async function trackVideoView(videoId: string, userId: string) {
  await prisma.activityLog.create({
    data: {
      user_id: userId,
      action: 'video_view',
      entity_type: 'video',
      entity_id: videoId,
    },
  });
}

// Get video quality options
export async function getVideoQualities(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { qualities: { orderBy: { quality: 'asc' } } },
  });

  if (!video) return [];

  return video.qualities.map(q => ({
    quality: q.quality,
    resolution: q.resolution,
    bitrate: q.bitrate,
    size: q.size,
  }));
}

// Check if video is accessible
export async function canAccessVideo(
  videoId: string,
  userId: string | null,
  isAdmin: boolean = false
): Promise<boolean> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      material: {
        include: {
          section: {
            include: {
              course: { select: { mentor_id: true, id: true } },
            },
          },
        },
      },
    },
  });

  if (!video) return false;
  if (isAdmin) return true;

  // Check if it's a free preview
  if (video.material?.is_free) return true;

  if (!userId) return false;

  // Check if user is mentor
  if (video.material?.section?.course?.mentor_id === userId) return true;

  // Check if user is enrolled
  if (video.material?.section?.course) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: video.material.section.course.id,
        },
      },
    });
    return !!enrollment;
  }

  return false;
}
