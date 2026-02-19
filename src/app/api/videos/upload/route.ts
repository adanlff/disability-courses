import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole, VideoStatus, VideoQuality } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/videos/upload - Upload video
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const materialId = formData.get('material_id') as string;

    if (!file || !materialId) {
      return NextResponse.json({ error: 'File dan material_id wajib diisi' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format video tidak didukung' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos');
    await mkdir(uploadDir, { recursive: true });

    // Generate filename
    const ext = file.name.split('.').pop();
    const filename = `video_${materialId}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);
    await writeFile(filepath, uint8Array);

    // Path without leading slash for proper URL conversion
    const videoPath = `uploads/videos/${filename}`;

    // Create video record - set as PROCESSED since we save the original directly
    const video = await prisma.video.create({
      data: {
        original_name: file.name,
        filename: filename,
        path: videoPath,
        size: file.size,
        mime_type: file.type,
        status: VideoStatus.COMPLETED, // Mark as completed since original is playable
      },
    });

    // Update material to link to video
    await prisma.material.update({
      where: { id: materialId },
      data: { video_id: video.id },
    });

    // Create default quality pointing to original file
    await prisma.videoQuality_Model.create({
      data: {
        video_id: video.id,
        quality: VideoQuality.Q720P,
        path: videoPath,
        size: file.size,
        bitrate: '2500kbps',
        resolution: '1280x720',
      },
    });

    return NextResponse.json({
      message: 'Video berhasil diupload',
      video,
      url: videoPath,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
