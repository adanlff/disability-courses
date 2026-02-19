import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// POST /api/reviews/[id]/helpful - Mark review as helpful
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { helpful_count: { increment: 1 } },
    });

    return NextResponse.json({ message: 'Terima kasih atas feedback Anda', review: updatedReview });
  } catch (error) {
    console.error('Helpful review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
