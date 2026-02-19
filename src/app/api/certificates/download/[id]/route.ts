import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/certificates/download/[id] - Download certificate
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { full_name: true } },
        course: {
          select: {
            title: true,
            mentor: { include: { user: { select: { full_name: true } } } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 });
    }

    if (certificate.status !== 'ISSUED') {
      return NextResponse.json({ error: 'Sertifikat tidak valid' }, { status: 400 });
    }

    // Return certificate data for frontend PDF generation
    return NextResponse.json({
      certificate: {
        number: certificate.certificate_number,
        student_name: certificate.user.full_name,
        course_title: certificate.course.title,
        mentor_name: certificate.course.mentor.user.full_name,
        issued_at: certificate.issued_at,
        metadata: certificate.metadata,
      },
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
