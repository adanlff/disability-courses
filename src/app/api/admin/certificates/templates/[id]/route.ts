import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/certificates/templates/[id] - Get specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN, UserRole.MENTOR])) return forbiddenResponse();

    const template = await prisma.systemSetting.findUnique({
      where: { id: params.id },
    });

    if (!template || template.category !== 'certificate_template') {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Get certificate template error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/admin/certificates/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { name, content, is_default } = body;

    const existingTemplate = await prisma.systemSetting.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate || existingTemplate.category !== 'certificate_template') {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    const template = await prisma.systemSetting.update({
      where: { id: params.id },
      data: {
        value: JSON.stringify({ name, content, is_default: is_default || false }),
      },
    });

    return NextResponse.json({ message: 'Template berhasil diperbarui', template });
  } catch (error) {
    console.error('Update certificate template error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/certificates/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const existingTemplate = await prisma.systemSetting.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate || existingTemplate.category !== 'certificate_template') {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    await prisma.systemSetting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Template berhasil dihapus' });
  } catch (error) {
    console.error('Delete certificate template error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
