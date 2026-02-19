import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { reportSchema } from '@/lib/validation';

// POST /api/reviews/report - Report a review
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { review_id, reason, description } = body;

    if (!review_id) {
      return NextResponse.json({ error: 'Review ID wajib diisi' }, { status: 400 });
    }

    const result = reportSchema.safeParse({ reason, description });
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: review_id } });
    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    await prisma.activityLog.create({
      data: {
        user_id: authUser.userId,
        action: 'REPORT_REVIEW',
        entity_type: 'review',
        entity_id: review_id,
        metadata: { reason: result.data.reason, description: result.data.description },
      },
    });

    return NextResponse.json({ message: 'Laporan berhasil dikirim' });
  } catch (error) {
    console.error('Report review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
