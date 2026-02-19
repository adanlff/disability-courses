import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { key: string };
}

// GET /api/admin/settings/[key] - Get setting by key
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const setting = await prisma.systemSetting.findUnique({
      where: { key: params.key },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Get setting error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/admin/settings/[key] - Update setting
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { value, type, category, is_public } = body;

    const setting = await prisma.systemSetting.update({
      where: { key: params.key },
      data: { value, type, category, is_public },
    });

    return NextResponse.json({ message: 'Setting berhasil diperbarui', setting });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/settings/[key] - Delete setting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    await prisma.systemSetting.delete({ where: { key: params.key } });

    return NextResponse.json({ message: 'Setting berhasil dihapus' });
  } catch (error) {
    console.error('Delete setting error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
