import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { createCommentSchema } from '@/lib/validation';

interface RouteParams {
  params: { id: string };
}

// GET /api/materials/[id]/comments - Get material comments
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const comments = await prisma.comment.findMany({
      where: { material_id: id, parent_id: null },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
        replies: {
          include: {
            user: { select: { id: true, full_name: true, avatar_url: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/materials/[id]/comments - Create comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;
    const body = await request.json();

    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        user_id: authUser.userId,
        material_id: id,
        content: result.data.content,
        parent_id: result.data.parent_id,
      },
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
      },
    });

    return NextResponse.json({ message: 'Komentar berhasil ditambahkan', comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
