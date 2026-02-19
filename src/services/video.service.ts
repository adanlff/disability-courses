// Video Service
import prisma from '@/lib/prisma';
import { VideoStatus, VideoQuality } from '@prisma/client';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { storageConfig } from '@/config/storage.config';

// Create video record
export async function createVideo(data: {
  original_name: string;
  filename: string;
  path: string;
  size: number;
  mime_type: string;
}) {
  return prisma.video.create({
    data: {
      original_name: data.original_name,
      filename: data.filename,
      path: data.path,
      size: data.size,
      mime_type: data.mime_type,
      status: VideoStatus.UPLOADING,
    },
  });
}

// Get video by ID
export async function getVideoById(id: string) {
  return prisma.video.findUnique({
    where: { id },
    include: {
      qualities: { orderBy: { quality: 'asc' } },
      material: {
        include: {
          section: {
            include: { course: { select: { id: true, title: true, mentor_id: true } } },
          },
        },
      },
    },
  });
}

// Update video status
export async function updateVideoStatus(
  id: string,
  status: VideoStatus,
  data?: Partial<{
    duration: number;
    thumbnail: string;
    processing_error: string | null;
  }>
) {
  return prisma.video.update({
    where: { id },
    data: { status, ...data },
  });
}

// Add video quality
export async function addVideoQuality(videoId: string, data: {
  quality: VideoQuality;
  path: string;
  size: number;
  resolution: string;
  bitrate: string;
}) {
  return prisma.videoQuality_Model.create({
    data: {
      video_id: videoId,
      quality: data.quality,
      path: data.path,
      size: data.size,
      resolution: data.resolution,
      bitrate: data.bitrate,
    },
  });
}

// Upload and create video
export async function uploadVideo(file: File): Promise<{
  success: boolean;
  video?: { id: string; path: string };
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate
    const allowedTypes = storageConfig.allowedTypes.video;
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipe file tidak didukung' };
    }

    const maxSize = storageConfig.limits.video;
    if (file.size > maxSize) {
      return { success: false, error: 'Ukuran file melebihi batas' };
    }

    // Generate filename
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Save file
    const uploadPath = storageConfig.paths.videos;
    const fullPath = path.join(process.cwd(), 'uploads', uploadPath);
    await mkdir(fullPath, { recursive: true });

    const filePath = path.join(fullPath, filename);
    await writeFile(filePath, buffer);

    const videoPath = `/uploads/${uploadPath}/${filename}`;

    // Create video record
    const video = await createVideo({
      original_name: file.name,
      filename,
      path: videoPath,
      size: file.size,
      mime_type: file.type,
    });

    return { success: true, video: { id: video.id, path: videoPath } };
  } catch (error) {
    console.error('Upload video error:', error);
    return { success: false, error: 'Gagal mengupload video' };
  }
}

// Get video qualities
export async function getVideoQualities(videoId: string) {
  return prisma.videoQuality_Model.findMany({
    where: { video_id: videoId },
    orderBy: { quality: 'asc' },
  });
}

// Delete video
export async function deleteVideo(id: string) {
  return prisma.video.delete({ where: { id } });
}

// Update video thumbnail
export async function updateVideoThumbnail(id: string, thumbnailUrl: string) {
  return prisma.video.update({
    where: { id },
    data: { thumbnail: thumbnailUrl },
  });
}

// Get video processing status
export async function getVideoStatus(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      processing_error: true,
      duration: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!video) return null;

  let progress = 0;
  switch (video.status) {
    case VideoStatus.UPLOADING: progress = 25; break;
    case VideoStatus.PROCESSING: progress = 50; break;
    case VideoStatus.COMPLETED: progress = 100; break;
    case VideoStatus.FAILED: progress = 0; break;
  }

  return { ...video, progress };
}

// Process video (mock - integrate with actual video processor)
export async function processVideo(videoId: string): Promise<boolean> {
  try {
    await updateVideoStatus(videoId, VideoStatus.PROCESSING);

    // TODO: Integrate with FFmpeg or video processing service
    console.log(`Processing video ${videoId}`);

    // Simulate success
    await updateVideoStatus(videoId, VideoStatus.COMPLETED, {
      duration: 0,
    });

    return true;
  } catch (error) {
    console.error('Video processing error:', error);
    await updateVideoStatus(videoId, VideoStatus.FAILED, {
      processing_error: (error as Error).message,
    });
    return false;
  }
}

// Get mentor videos
export async function getMentorVideos(mentorId: string, options: {
  page?: number;
  limit?: number;
  status?: VideoStatus;
} = {}) {
  const { page = 1, limit = 20, status } = options;

  const where: Record<string, unknown> = {
    material: {
      section: {
        course: { mentor_id: mentorId },
      },
    },
  };

  if (status) where.status = status;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        material: {
          select: {
            title: true,
            section: {
              select: {
                title: true,
                course: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return { videos, total, page, limit, totalPages: Math.ceil(total / limit) };
}
