import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/payments/[id] - Get transaction detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        user_id: authUser.userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            discount_price: true,
            level: true,
            total_duration: true,
            total_lectures: true,
            mentor: {
              include: {
                user: { select: { full_name: true } },
              },
            },
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Get transaction detail error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail transaksi' }, { status: 500 });
  }
}
