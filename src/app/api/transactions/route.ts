import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { createTransactionSchema } from '@/lib/validation';
import { UserRole, TransactionStatus, PaymentMethod } from '@prisma/client';

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = isAdmin ? {} : { user_id: authUser.userId };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          course: { select: { id: true, title: true, thumbnail: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const result = createTransactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { course_id, payment_method } = result.data;

    const course = await prisma.course.findUnique({
      where: { id: course_id },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    if (course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Kursus tidak tersedia' }, { status: 400 });
    }

    // Check existing enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: { user_id: authUser.userId, course_id },
      },
    });

    if (enrollment) {
      return NextResponse.json({ error: 'Anda sudah terdaftar di kursus ini' }, { status: 400 });
    }

    // Check pending transaction
    const pendingTx = await prisma.transaction.findFirst({
      where: {
        user_id: authUser.userId,
        course_id,
        status: TransactionStatus.PENDING,
      },
    });

    if (pendingTx) {
      return NextResponse.json({ error: 'Anda memiliki transaksi yang belum selesai', transaction: pendingTx }, { status: 400 });
    }

    const amount = course.price;
    const discount = course.discount_price ? course.price - course.discount_price : 0;
    const totalAmount = course.discount_price || course.price;

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const transaction = await prisma.transaction.create({
      data: {
        user_id: authUser.userId,
        course_id,
        order_id: orderId,
        amount,
        discount,
        total_amount: totalAmount,
        payment_method: payment_method as PaymentMethod,
        status: TransactionStatus.PENDING,
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ message: 'Transaksi berhasil dibuat', transaction }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
