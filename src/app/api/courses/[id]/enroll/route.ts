import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { EnrollmentStatus, TransactionStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { id } = params;

    // Find course
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        is_free: true,
        price: true,
        discount_price: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    if (course.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Kursus tidak tersedia untuk pendaftaran' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Anda sudah terdaftar di kursus ini', enrollment: existingEnrollment },
        { status: 400 }
      );
    }

    // For free courses or price 0, enroll directly
    if (course.is_free || course.price === 0) {
      const enrollment = await prisma.enrollment.create({
        data: {
          user_id: authUser.userId,
          course_id: id,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      // Update course total students
      await prisma.course.update({
        where: { id },
        data: { total_students: { increment: 1 } },
      });

      // Update mentor total students
      const courseWithMentor = await prisma.course.findUnique({
        where: { id },
        select: { mentor_id: true },
      });
      
      if (courseWithMentor) {
        await prisma.mentorProfile.update({
          where: { id: courseWithMentor.mentor_id },
          data: { total_students: { increment: 1 } },
        });
      }

      return NextResponse.json({
        message: 'Berhasil mendaftar kursus',
        enrollment,
      });
    }

    // For paid courses, check for completed transaction
    const paidTransaction = await prisma.transaction.findFirst({
      where: {
        user_id: authUser.userId,
        course_id: id,
        status: 'SUCCESS' as TransactionStatus,
      },
    });

    if (!paidTransaction) {
      return NextResponse.json(
        { error: 'Silakan selesaikan pembayaran terlebih dahulu' },
        { status: 402 }
      );
    }

    // Create enrollment for paid course
    const enrollment = await prisma.enrollment.create({
      data: {
        user_id: authUser.userId,
        course_id: id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Update totals
    await prisma.course.update({
      where: { id },
      data: { total_students: { increment: 1 } },
    });

    return NextResponse.json({
      message: 'Berhasil mendaftar kursus',
      enrollment,
    });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
