import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { CourseStatus, UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/courses/[id]/publish - Publish a course
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
      include: {
        mentor: { select: { user_id: true, status: true } },
        sections: {
          include: { materials: true },
        },
      },
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

    // Check mentor status
    if (course.mentor.status !== 'APPROVED' && !isAdmin) {
      return NextResponse.json(
        { error: 'Profil mentor harus disetujui terlebih dahulu' },
        { status: 403 }
      );
    }

    // Validate course has content
    if (course.sections.length === 0) {
      return NextResponse.json(
        { error: 'Kursus harus memiliki minimal 1 section' },
        { status: 400 }
      );
    }

    const hasMaterials = course.sections.some(s => s.materials.length > 0);
    if (!hasMaterials) {
      return NextResponse.json(
        { error: 'Kursus harus memiliki minimal 1 materi' },
        { status: 400 }
      );
    }

    // If mentor, submit for review; if admin, publish directly
    const newStatus = isAdmin ? CourseStatus.PUBLISHED : CourseStatus.PENDING_REVIEW;

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: newStatus,
        published_at: newStatus === CourseStatus.PUBLISHED ? new Date() : null,
      },
    });


    return NextResponse.json({
      message: isAdmin 
        ? 'Kursus berhasil dipublikasikan' 
        : 'Kursus berhasil diajukan untuk review',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Publish course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
