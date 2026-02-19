import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { reportSchema } from '@/lib/validation';

// POST /api/comments/report - Report a comment
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { comment_id, reason, description } = body;

    if (!comment_id) {
      return NextResponse.json({ error: 'Comment ID wajib diisi' }, { status: 400 });
    }

    const result = reportSchema.safeParse({ reason, description });
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: comment_id } });
    if (!comment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'REPORT_COMMENT',
        entity_type: 'comment',
        entity_id: comment_id,
        metadata: { reason: result.data.reason, description: result.data.description },
      },
    });

    return NextResponse.json({ message: 'Laporan berhasil dikirim' });
  } catch (error) {
    console.error('Report comment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
