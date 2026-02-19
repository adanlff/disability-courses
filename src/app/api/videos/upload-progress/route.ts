import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// In-memory store for upload progress (use Redis in production)
const uploadProgress = new Map<string, { progress: number; status: string; filename?: string }>();

// GET /api/videos/upload-progress - Get upload progress for current user
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('upload_id');

    if (uploadId) {
      // Get specific upload progress
      const key = `${authUser.userId}:${uploadId}`;
      const progress = uploadProgress.get(key);

      if (!progress) {
        return NextResponse.json({ error: 'Upload tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json(progress);
    }

    // Get all active uploads for user
    const userUploads: Record<string, { progress: number; status: string; filename?: string }> = {};
    
    uploadProgress.forEach((value, key) => {
      if (key.startsWith(`${authUser.userId}:`)) {
        const uploadId = key.split(':')[1];
        userUploads[uploadId] = value;
      }
    });

    return NextResponse.json({ uploads: userUploads });
  } catch (error) {
    console.error('Get upload progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/videos/upload-progress - Update upload progress
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { upload_id, progress, status, filename } = body;

    if (!upload_id) {
      return NextResponse.json({ error: 'Upload ID wajib diisi' }, { status: 400 });
    }

    const key = `${authUser.userId}:${upload_id}`;
    
    uploadProgress.set(key, {
      progress: progress || 0,
      status: status || 'uploading',
      filename,
    });

    // Clean up completed uploads after 5 minutes
    if (status === 'completed' || status === 'failed') {
      setTimeout(() => {
        uploadProgress.delete(key);
      }, 5 * 60 * 1000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update upload progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/videos/upload-progress - Cancel/clear upload
export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('upload_id');

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID wajib diisi' }, { status: 400 });
    }

    const key = `${authUser.userId}:${uploadId}`;
    uploadProgress.delete(key);

    return NextResponse.json({ message: 'Upload dibatalkan' });
  } catch (error) {
    console.error('Cancel upload error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
