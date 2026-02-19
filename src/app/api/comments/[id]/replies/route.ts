import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { createCommentSchema } from '@/lib/validation';

interface RouteParams {
  params: { id: string };
}

// GET /api/comments/[id]/replies - Get comment replies
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const replies = await prisma.comment.findMany({
      where: { parent_id: id },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
      },
    });

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Get replies error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/comments/[id]/replies - Add reply
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const parentComment = await prisma.comment.findUnique({ where: { id } });
    if (!parentComment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const result = createCommentSchema.safeParse({ ...body, parent_id: id });
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const reply = await prisma.comment.create({
      data: {
        user_id: authUser.userId,
        material_id: parentComment.material_id,
        content: result.data.content,
        parent_id: id,
      },
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
      },
    });

    return NextResponse.json({ message: 'Balasan berhasil ditambahkan', reply }, { status: 201 });
  } catch (error) {
    console.error('Add reply error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
