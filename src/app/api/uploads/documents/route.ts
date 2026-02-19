import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// POST /api/uploads/documents - Upload document files
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Only allow mentors and admins to upload
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md'];
    
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan PDF, DOC, DOCX, PPT, PPTX, TXT, atau MD' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 50MB' },
        { status: 400 }
      );
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = fileExt || '.pdf';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
    const filename = `${timestamp}-${randomStr}-${safeOriginalName}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    await writeFile(filepath, buffer);

    // Generate URL - use /api/uploads to serve via API route
    const url = `/api/uploads/documents/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
      message: 'Dokumen berhasil diupload',
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat upload dokumen' },
      { status: 500 }
    );
  }
}
