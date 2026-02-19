import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// PUT /api/materials/[id]/reorder - Reorder materials
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params; // section ID

    const section = await prisma.section.findUnique({
      where: { id },
      include: { course: { include: { mentor: true } } },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section tidak ditemukan' }, { status: 404 });
    }

    const isMentor = section.course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { materials } = body as { materials: { id: string; order: number }[] };

    if (!materials || !Array.isArray(materials)) {
      return NextResponse.json({ error: 'Data materials wajib diisi' }, { status: 400 });
    }

    await prisma.$transaction(
      materials.map(m =>
        prisma.material.update({
          where: { id: m.id },
          data: { order: m.order },
        })
      )
    );

    return NextResponse.json({ message: 'Urutan materi berhasil diperbarui' });
  } catch (error) {
    console.error('Reorder materials error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
