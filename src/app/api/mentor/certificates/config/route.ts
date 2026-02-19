import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentor/certificates/config - Get mentor certificate config
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    // Get mentor config from system settings
    const signatureSetting = await prisma.systemSetting.findUnique({
      where: { key: `mentor_signature_${mentorProfile.id}` },
    });

    const templateSetting = await prisma.systemSetting.findUnique({
      where: { key: `mentor_template_${mentorProfile.id}` },
    });

    return NextResponse.json({
      config: {
        signature_url: signatureSetting?.value || null,
        selected_template_id: templateSetting?.value || null,
      },
    });
  } catch (error) {
    console.error('Get mentor config error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/mentor/certificates/config - Update mentor certificate config
export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { selected_template_id } = body;

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    // Update template selection
    if (selected_template_id !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: `mentor_template_${mentorProfile.id}` },
        update: { value: selected_template_id || '' },
        create: {
          key: `mentor_template_${mentorProfile.id}`,
          value: selected_template_id || '',
          type: 'string',
          category: 'mentor_config',
          is_public: false,
        },
      });
    }

    return NextResponse.json({ message: 'Konfigurasi berhasil disimpan' });
  } catch (error) {
    console.error('Update mentor config error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
