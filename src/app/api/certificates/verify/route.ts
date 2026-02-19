import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/certificates/verify - Verify certificate number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');

    if (!number) {
      return NextResponse.json({ error: 'Nomor sertifikat wajib diisi' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificate_number: number },
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
      return NextResponse.json({ valid: false, message: 'Sertifikat tidak ditemukan' });
    }

    if (certificate.status === 'REVOKED') {
      return NextResponse.json({ valid: false, message: 'Sertifikat telah dicabut' });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        number: certificate.certificate_number,
        student_name: certificate.user.full_name,
        course_title: certificate.course.title,
        mentor_name: certificate.course.mentor.user.full_name,
        issued_at: certificate.issued_at,
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
