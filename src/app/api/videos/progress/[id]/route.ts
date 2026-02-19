import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// POST /api/videos/progress/[id] - Update video watch progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { position, duration } = body;

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        material: { include: { section: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
    }

    if (!video.material) {
      return NextResponse.json({ error: 'Video tidak terikat ke materi' }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: video.material.section.course_id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    }

    // Check if video is completed (watched 90% or more)
    const isCompleted = position >= duration * 0.9;

    const progress = await prisma.progress.upsert({
      where: {
        enrollment_id_material_id: {
          enrollment_id: enrollment.id,
          material_id: video.material.id,
        },
      },
      update: {
        watched_duration: Math.max(position, 0),
        last_position: position,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : undefined,
      },
      create: {
        enrollment_id: enrollment.id,
        material_id: video.material.id,
        user_id: authUser.userId,
        watched_duration: position,
        last_position: position,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : undefined,
      },
    });

    return NextResponse.json({ message: 'Progress disimpan', progress });
  } catch (error) {
    console.error('Update video progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
