import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import midtrans from '@/lib/midtrans';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';
import { TransactionStatus, PaymentMethod, EnrollmentStatus } from '@prisma/client';

// POST /api/payments/create - Create payment transaction
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID diperlukan' }, { status: 400 });
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: course_id },
      include: {
        mentor: {
          include: {
            user: { select: { full_name: true } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    if (course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Kursus belum tersedia' }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: course_id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Anda sudah terdaftar di kursus ini' }, { status: 400 });
    }

    // If course is free, enroll directly and create transaction record
    if (course.is_free || course.price === 0) {
      // Generate order ID for free transaction
      const timestamp = Date.now();
      const orderId = `FREE-${timestamp}-${course.id.substring(0, 8)}`;

      // Create transaction record for free course
      const transaction = await prisma.transaction.create({
        data: {
          user_id: authUser.userId,
          course_id: course_id,
          order_id: orderId,
          amount: 0,
          discount: 0,
          total_amount: 0,
          payment_method: 'FREE' as PaymentMethod,
          status: TransactionStatus.SUCCESS,
          paid_at: new Date(),
          metadata: {
            course_title: course.title,
            mentor_name: course.mentor?.user?.full_name || 'Mentor',
            is_free: true,
          },
        },
      });

      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          user_id: authUser.userId,
          course_id: course_id,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      // Update course student count
      await prisma.course.update({
        where: { id: course_id },
        data: { total_students: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        message: 'Berhasil mendaftar kursus gratis',
        enrollment,
        transaction,
        is_free: true,
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check for pending transaction
    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        user_id: authUser.userId,
        course_id: course_id,
        status: TransactionStatus.PENDING,
        expired_at: { gt: new Date() },
      },
    });

    if (pendingTransaction && pendingTransaction.payment_url) {
      return NextResponse.json({
        success: true,
        transaction: pendingTransaction,
        payment_url: pendingTransaction.payment_url,
        token: pendingTransaction.metadata && typeof pendingTransaction.metadata === 'object' 
          ? (pendingTransaction.metadata as { token?: string }).token 
          : null,
      });
    }

    // Generate order ID
    const timestamp = Date.now();
    const orderId = `INV-${timestamp}-${course.id.substring(0, 8)}`;

    // Calculate amounts
    const amount = course.discount_price || course.price;
    const discount = course.discount_price ? course.price - course.discount_price : 0;

    // Get base URL for callbacks (must be absolute URL for Midtrans)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

    // Create Midtrans transaction
    const midtransParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: user.full_name.split(' ')[0],
        last_name: user.full_name.split(' ').slice(1).join(' ') || undefined,
        email: user.email,
        phone: user.phone || undefined,
      },
      item_details: [
        {
          id: course.id,
          price: Math.round(amount),
          quantity: 1,
          name: course.title.substring(0, 50),
          category: 'Online Course',
        },
      ],
      callbacks: {
        finish: `${appUrl}/user/courses/${course.id}/success`,
        error: `${appUrl}/user/courses/${course.id}/failed`,
        pending: `${appUrl}/user/courses/${course.id}/pending`,
      },
    };

    const midtransResponse = await midtrans.createTransaction(midtransParams);

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        user_id: authUser.userId,
        course_id: course_id,
        order_id: orderId,
        amount: course.price,
        discount: discount,
        total_amount: amount,
        payment_method: 'MIDTRANS' as PaymentMethod,
        status: TransactionStatus.PENDING,
        payment_url: midtransResponse.redirect_url,
        // Don't set expired_at here - let Midtrans manage expiration per payment method
        // Each payment method has different expiration (ShopeePay = 1 min, VA = 24h, etc)
        metadata: {
          token: midtransResponse.token,
          course_title: course.title,
          mentor_name: course.mentor.user.full_name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
      payment_url: midtransResponse.redirect_url,
      token: midtransResponse.token,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat transaksi pembayaran' },
      { status: 500 }
    );
  }
}

// GET /api/payments - Get user transactions
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: { user_id: string; status?: TransactionStatus } = {
      user_id: authUser.userId,
    };

    if (status && status !== 'all') {
      where.status = status as TransactionStatus;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            mentor: {
              include: {
                user: { select: { full_name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
  }
}
