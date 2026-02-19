import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/certificates - List all certificates
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      certificates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
