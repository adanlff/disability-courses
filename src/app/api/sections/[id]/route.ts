import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { updateSectionSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/sections/[id] - Get section by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const section = await prisma.section.findUnique({
      where: { id },
      include: { materials: { orderBy: { order: 'asc' } } },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Get section error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/sections/[id] - Update section
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

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
    const result = updateSectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedSection = await prisma.section.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ message: 'Section berhasil diperbarui', section: updatedSection });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/sections/[id] - Delete section
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

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

    await prisma.section.delete({ where: { id } });

    return NextResponse.json({ message: 'Section berhasil dihapus' });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
