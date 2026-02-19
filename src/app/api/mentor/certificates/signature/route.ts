import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/mentor/certificates/signature - Upload mentor signature
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tanda tangan wajib diisi' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PNG, JPG, atau WebP' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'signatures');
    await mkdir(uploadDir, { recursive: true });

    // Generate filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `signature_${mentorProfile.id}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);
    await writeFile(filepath, uint8Array);

    // Path without leading slash for proper URL conversion
    const signaturePath = `uploads/signatures/${filename}`;
    const signatureUrl = `/api/${signaturePath}`;

    // Store signature URL in system settings for this mentor
    await prisma.systemSetting.upsert({
      where: { key: `mentor_signature_${mentorProfile.id}` },
      update: { value: signatureUrl },
      create: {
        key: `mentor_signature_${mentorProfile.id}`,
        value: signatureUrl,
        type: 'string',
        category: 'mentor_config',
        is_public: false,
      },
    });

    return NextResponse.json({
      message: 'Tanda tangan berhasil diupload',
      signature_url: signatureUrl,
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
