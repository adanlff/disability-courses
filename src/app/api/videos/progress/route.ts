// app/api/videos/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { z } from 'zod';

const progressSchema = z.object({
  material_id: z.string().uuid(),
  last_position: z.number().min(0).optional(),
  watched_duration: z.number().min(0).optional(),
  is_completed: z.boolean().optional(),
});

// POST /api/videos/progress - Save video progress
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const validation = progressSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { material_id, last_position, watched_duration, is_completed } = validation.data;

    // Get material and course info
    const material = await prisma.material.findUnique({
      where: { id: material_id },
      include: {
        section: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material tidak ditemukan' }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: material.section.course_id,
        },
      },
    });

    if (!enrollment && !material.is_free) {
      return NextResponse.json({ error: 'Anda belum terdaftar di kursus ini' }, { status: 403 });
    }

    if (!enrollment) {
      // For free materials without enrollment, just return success
      return NextResponse.json({
        message: 'Progress tidak disimpan (materi gratis tanpa enrollment)',
        progress: null,
      });
    }

    // Check if progress exists
    const existingProgress = await prisma.progress.findUnique({
      where: {
        enrollment_id_material_id: {
          enrollment_id: enrollment.id,
          material_id: material_id,
        },
      },
    });

    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          last_position: last_position ?? existingProgress.last_position,
          watched_duration: watched_duration ?? existingProgress.watched_duration,
          is_completed: is_completed ?? existingProgress.is_completed,
          completed_at: is_completed ? new Date() : existingProgress.completed_at,
        },
      });
    } else {
      // Create new progress
      progress = await prisma.progress.create({
        data: {
          enrollment_id: enrollment.id,
          material_id: material_id,
          user_id: authUser.userId,
          last_position: last_position ?? 0,
          watched_duration: watched_duration ?? 0,
          is_completed: is_completed ?? false,
          completed_at: is_completed ? new Date() : null,
        },
      });
    }

    // Update enrollment progress percentage
    const allMaterials = await prisma.material.findMany({
      where: {
        section: {
          course_id: material.section.course_id,
        },
      },
      select: { id: true },
    });

    const completedProgress = await prisma.progress.count({
      where: {
        enrollment_id: enrollment.id,
        is_completed: true,
      },
    });

    const overallProgress = allMaterials.length > 0 
      ? Math.round((completedProgress / allMaterials.length) * 100)
      : 0;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: overallProgress,
        last_accessed_at: new Date(),
        completed_at: overallProgress === 100 ? new Date() : undefined,
      },
    });

    // Auto-generate certificate when course is 100% completed
    if (overallProgress === 100) {
      // Check if certificate already exists
      const existingCertificate = await prisma.certificate.findFirst({
        where: {
          user_id: authUser.userId,
          course_id: material.section.course_id,
        },
      });

      if (!existingCertificate) {
        // Generate unique certificate number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const certificateNumber = `CERT-${timestamp}-${random}`;

        // Create certificate
        const certificate = await prisma.certificate.create({
          data: {
            user_id: authUser.userId,
            course_id: material.section.course_id,
            certificate_number: certificateNumber,
            status: 'ISSUED',
            issued_at: new Date(),
          },
        });

        // Link certificate to enrollment
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { certificate_id: certificate.id },
        });
      }
    }

    return NextResponse.json({
      message: 'Progress tersimpan',
      progress,
    });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// GET /api/videos/progress - Get user progress for a material
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('material_id');

    if (!materialId) {
      return NextResponse.json({ error: 'material_id diperlukan' }, { status: 400 });
    }

    // Get material to find course
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { section: true },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material tidak ditemukan' }, { status: 404 });
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: material.section.course_id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ progress: null });
    }

    const progress = await prisma.progress.findUnique({
      where: {
        enrollment_id_material_id: {
          enrollment_id: enrollment.id,
          material_id: materialId,
        },
      },
    });

    return NextResponse.json({
      progress: progress || null,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
