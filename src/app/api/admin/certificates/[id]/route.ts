import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, CertificateStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/certificates/[id] - Get certificate
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        course: { include: { mentor: { include: { user: { select: { full_name: true } } } } } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/admin/certificates/[id] - Update certificate status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(CertificateStatus).includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const certificate = await prisma.certificate.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ message: 'Status sertifikat berhasil diperbarui', certificate });
  } catch (error) {
    console.error('Update certificate error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
