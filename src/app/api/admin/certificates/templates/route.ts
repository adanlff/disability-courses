import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/certificates/templates - List certificate templates
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    // Allow both ADMIN and MENTOR to read templates
    if (!hasRole(authUser, [UserRole.ADMIN, UserRole.MENTOR])) return forbiddenResponse();

    // Certificate templates stored in system settings
    const templates = await prisma.systemSetting.findMany({
      where: { category: 'certificate_template' },
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get certificate templates error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/admin/certificates/templates - Create certificate template
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { name, content, is_default } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Nama dan konten template wajib diisi' }, { status: 400 });
    }

    // Store template as system setting
    const template = await prisma.systemSetting.create({
      data: {
        key: `certificate_template_${Date.now()}`,
        value: JSON.stringify({ name, content, is_default: is_default || false }),
        type: 'json',
        category: 'certificate_template',
        is_public: false,
      },
    });

    return NextResponse.json({ message: 'Template berhasil dibuat', template }, { status: 201 });
  } catch (error) {
    console.error('Create certificate template error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
