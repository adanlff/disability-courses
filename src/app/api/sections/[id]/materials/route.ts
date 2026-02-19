import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { createMaterialSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/sections/[id]/materials - Get section materials
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const materials = await prisma.material.findMany({
      where: { section_id: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/sections/[id]/materials - Create material in section
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const result = createMaterialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = result.data;

    // Get max order
    let order = data.order;
    if (order === undefined) {
      const maxMaterial = await prisma.material.findFirst({
        where: { section_id: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxMaterial?.order ?? -1) + 1;
    }

    const material = await prisma.material.create({
      data: {
        section_id: id,
        ...data,
        order,
      },
    });

    // Update section duration
    await prisma.section.update({
      where: { id },
      data: { duration: { increment: data.duration } },
    });

    // Update course totals
    await prisma.course.update({
      where: { id: section.course_id },
      data: {
        total_lectures: { increment: 1 },
        total_duration: { increment: data.duration },
      },
    });

    return NextResponse.json({ message: 'Materi berhasil dibuat', material }, { status: 201 });
  } catch (error) {
    console.error('Create material error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
