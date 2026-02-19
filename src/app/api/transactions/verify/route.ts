import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/transactions/verify - Verify transaction by order ID or course ID
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const courseId = searchParams.get('course_id');

    if (!orderId && !courseId) {
      return NextResponse.json({ error: 'Order ID atau Course ID wajib diisi' }, { status: 400 });
    }

    let transaction;

    if (orderId) {
      transaction = await prisma.transaction.findUnique({
        where: { order_id: orderId },
        include: {
          course: { select: { id: true, title: true } },
        },
      });
    } else if (courseId) {
      // Find the most recent transaction for this user and course
      transaction = await prisma.transaction.findFirst({
        where: {
          user_id: authUser.userId,
          course_id: courseId,
        },
        orderBy: { created_at: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
        },
      });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Verify transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
