// app/api/admin/courses/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

const rejectSchema = z.object({
  reason: z.string().optional(),
});

// PUT /api/admin/courses/[id]/reject - Reject a course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    // Only admins can reject courses
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya admin yang dapat menolak kursus' },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const body = await request.json();
    const validation = rejectSchema.safeParse(body);

    const reason = validation.success ? validation.data.reason : undefined;

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

    // Only PENDING_REVIEW courses can be rejected
    if (course.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `Kursus dengan status ${course.status} tidak dapat ditolak` },
        { status: 400 }
      );
    }

    // Update course status back to DRAFT
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'DRAFT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kursus telah ditolak',
      course: updatedCourse,
      reason: reason || null,
    });
  } catch (error) {
    console.error('Reject course error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
