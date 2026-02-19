// Certificate Service
import prisma from '@/lib/prisma';
import { CertificateStatus, EnrollmentStatus } from '@prisma/client';

// Generate certificate number
function generateCertificateNumber(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Generate certificate for completed enrollment
export async function generateCertificate(enrollmentId: string, userId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: { select: { id: true, title: true } },
      user: { select: { full_name: true } },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment tidak ditemukan');
  }

  if (enrollment.user_id !== userId) {
    throw new Error('Tidak memiliki akses');
  }

  if (enrollment.status !== EnrollmentStatus.COMPLETED) {
    throw new Error('Kursus belum selesai');
  }

  // Check if certificate already exists for this user and course
  const existingCert = await prisma.certificate.findFirst({
    where: {
      user_id: userId,
      course_id: enrollment.course_id,
    },
  });

  if (existingCert) {
    return existingCert;
  }

  const certificate = await prisma.certificate.create({
    data: {
      user_id: userId,
      course_id: enrollment.course_id,
      certificate_number: generateCertificateNumber(),
      status: CertificateStatus.ISSUED,
      issued_at: new Date(),
    },
  });

  // Link enrollment to certificate
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificate_id: certificate.id },
  });

  return certificate;
}

// Get certificate by ID
export async function getCertificateById(id: string) {
  return prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { full_name: true, email: true } },
      course: { select: { title: true, thumbnail: true } },
      enrollment: { select: { completed_at: true } },
    },
  });
}

// Get certificate by number
export async function getCertificateByNumber(certificateNumber: string) {
  return prisma.certificate.findUnique({
    where: { certificate_number: certificateNumber },
    include: {
      user: { select: { full_name: true } },
      course: { 
        select: { 
          title: true,
          mentor: { select: { user: { select: { full_name: true } } } },
        },
      },
    },
  });
}

// Get user certificates
export async function getUserCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { user_id: userId },
    include: {
      course: { select: { title: true, thumbnail: true, slug: true } },
    },
    orderBy: { issued_at: 'desc' },
  });
}

// Verify certificate
export async function verifyCertificate(certificateNumber: string) {
  const certificate = await getCertificateByNumber(certificateNumber);

  if (!certificate) {
    return { valid: false, message: 'Sertifikat tidak ditemukan' };
  }

  if (certificate.status === CertificateStatus.REVOKED) {
    return { valid: false, message: 'Sertifikat telah dicabut' };
  }

  return {
    valid: true,
    certificate: {
      certificate_number: certificate.certificate_number,
      student_name: certificate.user.full_name,
      course_title: certificate.course.title,
      mentor_name: certificate.course.mentor.user.full_name,
      issued_at: certificate.issued_at,
    },
  };
}

// Revoke certificate (admin)
export async function revokeCertificate(id: string, reason?: string) {
  return prisma.certificate.update({
    where: { id },
    data: { 
      status: CertificateStatus.REVOKED,
      revoked_at: new Date(),
      revoke_reason: reason,
    },
  });
}
