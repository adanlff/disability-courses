import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/mentor/certificates/[id]/preview - Get rendered certificate HTML for mentor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) return forbiddenResponse();

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      include: {
        courses: { select: { id: true } },
        user: { select: { full_name: true } },
      },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    const courseIds = mentorProfile.courses.map((c: { id: string }) => c.id);

    // Get certificate with all related data
    const certificate = await prisma.certificate.findFirst({
      where: {
        id: params.id,
        course_id: { in: courseIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            mentor_id: true,
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 });
    }

    // Get mentor's selected template
    const mentorTemplateConfig = await prisma.systemSetting.findUnique({
      where: { key: `mentor_template_${mentorProfile.id}` },
    });

    // Get mentor's signature
    const mentorSignatureConfig = await prisma.systemSetting.findUnique({
      where: { key: `mentor_signature_${mentorProfile.id}` },
    });

    // Get the template content
    let templateContent = '';
    if (mentorTemplateConfig?.value) {
      const template = await prisma.systemSetting.findUnique({
        where: { id: mentorTemplateConfig.value },
      });
      if (template) {
        try {
          const parsed = JSON.parse(template.value);
          templateContent = parsed.content || '';
        } catch {
          // Invalid JSON
        }
      }
    }

    // If no template selected, get default template
    if (!templateContent) {
      const defaultTemplate = await prisma.systemSetting.findFirst({
        where: { category: 'certificate_template' },
        orderBy: { created_at: 'asc' },
      });
      if (defaultTemplate) {
        try {
          const parsed = JSON.parse(defaultTemplate.value);
          templateContent = parsed.content || '';
        } catch {
          // Invalid JSON
        }
      }
    }

    // If still no template, use fallback
    if (!templateContent) {
      templateContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
              .certificate { border: 3px solid #005EB8; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #005EB8; }
              .student-name { font-size: 24px; font-weight: bold; margin: 20px 0; }
              .course-title { font-size: 20px; color: #005EB8; margin: 10px 0; }
              .mentor-name { margin: 20px 0; }
              .signature { margin-top: 40px; }
              .signature img { max-height: 60px; }
              .cert-number { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="certificate">
              <h1>SERTIFIKAT</h1>
              <p>Dengan bangga diberikan kepada</p>
              <p class="student-name">{{STUDENT_NAME}}</p>
              <p>Telah berhasil menyelesaikan kursus</p>
              <p class="course-title">{{COURSE_TITLE}}</p>
              <p>dengan mentor {{MENTOR_NAME}}</p>
              <p>Diterbitkan pada {{ISSUED_DATE}}</p>
              <div class="signature">
                {{SIGNATURE_IMAGE}}
                <p>{{MENTOR_NAME}}</p>
              </div>
              <p class="cert-number">No. Sertifikat: {{CERTIFICATE_NUMBER}}</p>
            </div>
          </body>
        </html>
      `;
    }

    // Format date
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    // Build signature HTML
    const signatureUrl = mentorSignatureConfig?.value || '';
    const signatureHtml = signatureUrl 
      ? `<img src="${signatureUrl}" alt="Signature" style="max-height:60px;"/>`
      : '';

    // Replace placeholders
    const html = templateContent
      .replace(/\{\{STUDENT_NAME\}\}/g, certificate.user.full_name)
      .replace(/\{\{COURSE_TITLE\}\}/g, certificate.course.title)
      .replace(/\{\{MENTOR_NAME\}\}/g, mentorProfile.user.full_name)
      .replace(/\{\{ISSUED_DATE\}\}/g, certificate.issued_at ? formatDate(new Date(certificate.issued_at)) : formatDate(new Date()))
      .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, certificate.certificate_number)
      .replace(/\{\{SIGNATURE_IMAGE\}\}/g, signatureHtml);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Get mentor certificate preview error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
