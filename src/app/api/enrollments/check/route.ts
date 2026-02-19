import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/enrollments/check - Check enrollment status
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID wajib diisi' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: { user_id: authUser.userId, course_id: courseId },
      },
      include: { certificate: true },
    });

    return NextResponse.json({
      isEnrolled: !!enrollment,
      enrollment,
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
