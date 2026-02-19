// app/api/courses/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

const createCommentSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong').max(5000),
  parent_id: z.string().uuid().optional(),
  material_id: z.string().uuid().optional(),
});

// GET /api/courses/[id]/comments - Get all comments for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const courseId = params.id;
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('material_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, mentor_id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      parent_id: null, // Only get top-level comments
    };

    if (materialId) {
      whereClause.material_id = materialId;
    } else {
      // Get all materials for this course
      const materials = await prisma.material.findMany({
        where: {
          section: {
            course_id: courseId,
          },
        },
        select: { id: true },
      });

      whereClause.material_id = { in: materials.map(m => m.id) };
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });

    const totalComments = await prisma.comment.count({
      where: whereClause,
    });

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total: totalComments,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/courses/[id]/comments - Create a new comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const courseId = params.id;
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { content, parent_id, material_id } = validation.data;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            materials: {
              select: { id: true },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Get material_id if not provided
    let targetMaterialId = material_id;
    if (!targetMaterialId && course.sections[0]?.materials[0]) {
      targetMaterialId = course.sections[0].materials[0].id;
    }

    if (!targetMaterialId) {
      return NextResponse.json({ error: 'Kursus belum memiliki materi' }, { status: 400 });
    }

    // If replying, verify parent exists
    if (parent_id) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parent_id },
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Komentar induk tidak ditemukan' }, { status: 404 });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        user_id: authUser.userId,
        material_id: targetMaterialId,
        parent_id: parent_id || null,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Komentar berhasil dibuat',
      comment,
    }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
