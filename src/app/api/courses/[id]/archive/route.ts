import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { CourseStatus, UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/courses/[id]/archive - Archive a course
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

    // Archive course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.ARCHIVED,
      },
    });


    return NextResponse.json({
      message: 'Kursus berhasil diarsipkan',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Archive course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
