import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/admin/comments - Get all comments with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const materialId = searchParams.get('material_id') || '';
    const userId = searchParams.get('user_id') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (materialId) {
      where.material_id = materialId;
    }

    if (userId) {
      where.user_id = userId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          material: {
            select: {
              id: true,
              title: true,
              section: {
                select: {
                  id: true,
                  title: true,
                  course: {
                    select: { id: true, title: true, slug: true },
                  },
                },
              },
            },
          },
          parent: {
            select: { id: true, content: true },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    // Get stats
    const [totalComments, todayComments, editedComments, repliesCount] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.comment.count({ where: { is_edited: true } }),
      prisma.comment.count({ where: { parent_id: { not: null } } }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalComments,
        today: todayComments,
        edited: editedComments,
        replies: repliesCount,
      },
    });
  } catch (error) {
    console.error('Get admin comments error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Delete comment (admin can delete any comment)
export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    // Delete comment and all replies
    await prisma.comment.deleteMany({ where: { parent_id: commentId } });
    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Komentar berhasil dihapus' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
