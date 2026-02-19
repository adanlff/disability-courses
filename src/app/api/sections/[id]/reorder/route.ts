import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// PUT /api/sections/[id]/reorder - Reorder sections
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params; // This is the course ID for reordering sections

    const course = await prisma.course.findUnique({
      where: { id },
      include: { mentor: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    const isMentor = course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sections } = body as { sections: { id: string; order: number }[] };

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Data sections wajib diisi' }, { status: 400 });
    }

    // Update all sections order
    await prisma.$transaction(
      sections.map(s =>
        prisma.section.update({
          where: { id: s.id },
          data: { order: s.order },
        })
      )
    );

    return NextResponse.json({ message: 'Urutan section berhasil diperbarui' });
  } catch (error) {
    console.error('Reorder sections error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
