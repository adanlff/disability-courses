// app/api/admin/courses/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// PUT /api/admin/courses/[id]/approve - Approve a course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Only admins can approve courses
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya admin yang dapat menyetujui kursus' },
        { status: 403 }
      );
    }

    const courseId = params.id;

    // Get the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        mentor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Only PENDING_REVIEW courses can be approved
    if (course.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `Kursus dengan status ${course.status} tidak dapat disetujui` },
        { status: 400 }
      );
    }

    // Update course status to PUBLISHED
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        published_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kursus berhasil disetujui',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Approve course error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
