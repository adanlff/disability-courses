import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/reports/[id] - Get report details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const report = await prisma.activityLog.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });

    if (!report) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // Get the reported entity
    let entity = null;
    if (report.entity_type === 'comment') {
      entity = await prisma.comment.findUnique({
        where: { id: report.entity_id! },
        include: { user: { select: { full_name: true } } },
      });
    } else if (report.entity_type === 'review') {
      entity = await prisma.review.findUnique({
        where: { id: report.entity_id! },
        include: { user: { select: { full_name: true } } },
      });
    }

    return NextResponse.json({ report, entity });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/reports/[id] - Resolve report (delete reported content)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const report = await prisma.activityLog.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // Delete the reported entity
    if (report.entity_type === 'comment' && report.entity_id) {
      await prisma.comment.delete({ where: { id: report.entity_id } });
    } else if (report.entity_type === 'review' && report.entity_id) {
      await prisma.review.delete({ where: { id: report.entity_id } });
    }

    return NextResponse.json({ message: 'Laporan berhasil diselesaikan' });
  } catch (error) {
    console.error('Resolve report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
