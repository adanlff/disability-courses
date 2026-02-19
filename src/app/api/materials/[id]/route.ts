import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { updateMaterialSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/materials/[id] - Get material by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authUser = getAuthUser(request);

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        section: { include: { course: true } },
        video: true,
        resources: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    // Check if user can access full content
    let canAccess = material.is_free;
    if (authUser && !canAccess) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: material.section.course_id,
          },
        },
      });
      canAccess = !!enrollment;
    }

    if (!canAccess) {
      material.content = null;
      material.document_url = null;
    }

    return NextResponse.json({ material, canAccess });
  } catch (error) {
    console.error('Get material error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/materials/[id] - Update material
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: { section: { include: { course: { include: { mentor: true } } } } },
    });

    if (!material) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    const isMentor = material.section.course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateMaterialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ message: 'Materi berhasil diperbarui', material: updatedMaterial });
  } catch (error) {
    console.error('Update material error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/materials/[id] - Delete material
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: { section: { include: { course: { include: { mentor: true } } } } },
    });

    if (!material) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }

    const isMentor = material.section.course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.material.delete({ where: { id } });

    // Update section and course totals
    await prisma.section.update({
      where: { id: material.section_id },
      data: { duration: { decrement: material.duration } },
    });

    await prisma.course.update({
      where: { id: material.section.course_id },
      data: {
        total_lectures: { decrement: 1 },
        total_duration: { decrement: material.duration },
      },
    });

    return NextResponse.json({ message: 'Materi berhasil dihapus' });
  } catch (error) {
    console.error('Delete material error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
