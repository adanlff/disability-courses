import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionStatus, EnrollmentStatus } from '@prisma/client';

// POST /api/transactions/webhook - Payment gateway webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, payment_id } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { order_id },
      include: { course: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (status === 'success' || status === 'paid') {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.PAID,
            paid_at: new Date(),
            metadata: { payment_id },
          },
        }),
        prisma.enrollment.create({
          data: {
            user_id: transaction.user_id,
            course_id: transaction.course_id,
            status: EnrollmentStatus.ACTIVE,
          },
        }),
        prisma.course.update({
          where: { id: transaction.course_id },
          data: { total_students: { increment: 1 } },
        }),
      ]);

      // Update mentor revenue
      await prisma.mentorProfile.update({
        where: { id: transaction.course.mentor_id },
        data: {
          total_revenue: { increment: transaction.total_amount },
          total_students: { increment: 1 },
        },
      });
    } else if (status === 'failed' || status === 'cancelled') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: status === 'failed' ? TransactionStatus.FAILED : TransactionStatus.CANCELLED },
      });
    }

    return NextResponse.json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
