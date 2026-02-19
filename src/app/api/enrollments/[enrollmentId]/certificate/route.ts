import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

interface RouteParams {
  params: { enrollmentId: string };
}

// POST /api/enrollments/[enrollmentId]/certificate - Generate certificate
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { enrollmentId } = params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { include: { mentor: { include: { user: true } } } },
        user: true,
        certificate: true,
      },
    });

    if (!enrollment || enrollment.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    }

    if (enrollment.certificate) {
      return NextResponse.json({ error: 'Sertifikat sudah ada', certificate: enrollment.certificate }, { status: 400 });
    }

    if (enrollment.progress < 100) {
      return NextResponse.json({ error: 'Kursus belum selesai' }, { status: 400 });
    }

    // Generate certificate number
    const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const certificate = await prisma.certificate.create({
      data: {
        user_id: authUser.userId,
        course_id: enrollment.course_id,
        certificate_number: certNumber,
        status: CertificateStatus.ISSUED,
        issued_at: new Date(),
        metadata: {
          student_name: enrollment.user.full_name,
          course_title: enrollment.course.title,
          mentor_name: enrollment.course.mentor.user.full_name,
          completion_date: new Date().toISOString(),
        },
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { certificate_id: certificate.id },
    });

    return NextResponse.json({ message: 'Sertifikat berhasil dibuat', certificate }, { status: 201 });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
