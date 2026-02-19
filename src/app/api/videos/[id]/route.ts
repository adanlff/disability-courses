import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse } from '@/lib/auth';
import { updateVideoSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/videos/[id] - Get video by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        material: {
          include: {
            section: { include: { course: { include: { mentor: true } } } },
          },
        },
        qualities: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    // Check access - allow admin always, or mentor if video is linked to their course
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isMentor = video.material?.section?.course?.mentor?.user_id === authUser.userId;

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/videos/[id] - Update video
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        material: { include: { section: { include: { course: { include: { mentor: true } } } } } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isMentor = video.material?.section?.course?.mentor?.user_id === authUser.userId;

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateVideoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await prisma.video.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ message: 'Video berhasil diperbarui', video: updated });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/videos/[id] - Delete video
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        material: { include: { section: { include: { course: { include: { mentor: true } } } } } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const isMentor = video.material?.section?.course?.mentor?.user_id === authUser.userId;

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.video.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Video berhasil dihapus' });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
