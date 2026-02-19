import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { createSectionSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/courses/[id]/sections - Get course sections
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const sections = await prisma.section.findMany({
      where: { course_id: id },
      orderBy: { order: 'asc' },
      include: {
        materials: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            content: true,
            video_id: true,
            document_url: true,
            youtube_url: true,
            duration: true,
            order: true,
            is_free: true,
            video: {
              select: {
                id: true,
                status: true,
                path: true,
                thumbnail: true,
              },
            },
          },
        },
        _count: {
          select: { materials: true },
        },
      },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/sections - Create a new section
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find course and check ownership
    const course = await prisma.course.findUnique({
      where: { id },
      include: { mentor: { select: { user_id: true } } },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    const isMentor = course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const result = createSectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get max order if not provided
    let order = data.order;
    if (order === undefined) {
      const maxSection = await prisma.section.findFirst({
        where: { course_id: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxSection?.order ?? -1) + 1;
    }

    const section = await prisma.section.create({
      data: {
        course_id: id,
        title: data.title,
        description: data.description,
        order,
      },
      include: {
        materials: true,
      },
    });

    return NextResponse.json(
      { message: 'Section berhasil dibuat', section },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create section error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
