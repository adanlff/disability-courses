import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import midtrans, { MidtransNotification } from '@/lib/midtrans';
import { TransactionStatus, EnrollmentStatus } from '@prisma/client';

// POST /api/payments/notification - Midtrans webhook notification handler
export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json();

    console.log('Midtrans notification received:', notification);

    // Verify signature
    if (!midtrans.verifySignature(notification)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const { order_id, transaction_status, fraud_status, payment_type } = notification;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { order_id },
      include: {
        course: true,
        user: true,
      },
    });

    if (!transaction) {
      console.error('Transaction not found:', order_id);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Determine new status
    let newStatus: TransactionStatus = transaction.status;
    let shouldEnroll = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        newStatus = 'SUCCESS' as TransactionStatus;
        shouldEnroll = true;
      } else if (fraud_status === 'challenge') {
        newStatus = TransactionStatus.PENDING;
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'SUCCESS' as TransactionStatus;
      shouldEnroll = true;
    } else if (transaction_status === 'pending') {
      newStatus = TransactionStatus.PENDING;
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      transaction_status === 'cancel'
    ) {
      newStatus = TransactionStatus.FAILED;
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      newStatus = 'REFUNDED' as TransactionStatus;
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        paid_at: shouldEnroll ? new Date() : undefined,
        metadata: {
          ...(transaction.metadata as object || {}),
          payment_type,
          transaction_status,
          fraud_status,
          midtrans_transaction_id: notification.transaction_id,
          updated_at: new Date().toISOString(),
        },
      },
    });

    // Create enrollment if payment successful
    if (shouldEnroll) {
      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: transaction.user_id,
            course_id: transaction.course_id,
          },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            user_id: transaction.user_id,
            course_id: transaction.course_id,
            status: EnrollmentStatus.ACTIVE,
          },
        });

        // Update course total students
        await prisma.course.update({
          where: { id: transaction.course_id },
          data: { total_students: { increment: 1 } },
        });

        // Update mentor total students
        await prisma.mentorProfile.update({
          where: { id: transaction.course.mentor_id },
          data: { total_students: { increment: 1 } },
        });

        console.log('Enrollment created for user:', transaction.user_id);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Payment notification error:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

// GET /api/payments/notification?order_id=xxx - Check payment status and create enrollment if successful
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get status from Midtrans
    const midtransStatus = await midtrans.getTransactionStatus(orderId);

    // Find and update local transaction
    const transaction = await prisma.transaction.findUnique({
      where: { order_id: orderId },
      include: {
        course: true,
      },
    });

    if (transaction) {
      let newStatus: TransactionStatus = transaction.status;
      let shouldEnroll = false;

      if (midtransStatus.transaction_status === 'settlement' || 
          midtransStatus.transaction_status === 'capture') {
        newStatus = TransactionStatus.SUCCESS;
        shouldEnroll = true;
      } else if (midtransStatus.transaction_status === 'pending') {
        newStatus = TransactionStatus.PENDING;
      } else if (['deny', 'expire', 'cancel'].includes(midtransStatus.transaction_status)) {
        newStatus = TransactionStatus.FAILED;
      }

      // Update transaction status if changed
      if (newStatus !== transaction.status) {
        const isExpired = midtransStatus.transaction_status === 'expire';
        const isFailed = ['deny', 'cancel'].includes(midtransStatus.transaction_status);
        
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: newStatus,
            paid_at: shouldEnroll ? new Date() : undefined,
            // Set expired_at when transaction expires from Midtrans
            expired_at: isExpired ? new Date() : transaction.expired_at,
            metadata: {
              ...(transaction.metadata as object || {}),
              payment_type: midtransStatus.payment_type,
              transaction_status: midtransStatus.transaction_status,
              midtrans_transaction_id: midtransStatus.transaction_id,
              verified_at: new Date().toISOString(),
              // Add failure reason for expired/failed transactions
              ...(isExpired && { failure_reason: 'Waktu pembayaran habis (expired)' }),
              ...(isFailed && { failure_reason: `Pembayaran ${midtransStatus.transaction_status === 'deny' ? 'ditolak' : 'dibatalkan'}` }),
            },
          },
        });
      }

      // Create enrollment if payment successful
      if (shouldEnroll) {
        // Check if enrollment already exists
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            user_id_course_id: {
              user_id: transaction.user_id,
              course_id: transaction.course_id,
            },
          },
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              user_id: transaction.user_id,
              course_id: transaction.course_id,
              status: EnrollmentStatus.ACTIVE,
            },
          });

          // Update course total students
          await prisma.course.update({
            where: { id: transaction.course_id },
            data: { total_students: { increment: 1 } },
          });

          // Update mentor total students and revenue
          if (transaction.course.mentor_id) {
            await prisma.mentorProfile.update({
              where: { id: transaction.course.mentor_id },
              data: { 
                total_students: { increment: 1 },
                total_revenue: { increment: transaction.total_amount },
              },
            });
          }

          console.log('Enrollment created via GET verification for user:', transaction.user_id);
        }
      }
    }

    const isExpired = midtransStatus.transaction_status === 'expire';
    const isSuccess = ['settlement', 'capture'].includes(midtransStatus.transaction_status);
    const isFailed = ['deny', 'cancel'].includes(midtransStatus.transaction_status);

    return NextResponse.json({
      success: true,
      status: midtransStatus.transaction_status,
      order_id: orderId,
      enrolled: isSuccess,
      expired: isExpired,
      failed: isFailed,
      message: isExpired 
        ? 'Waktu pembayaran habis. Silakan buat transaksi baru.' 
        : isFailed 
          ? 'Pembayaran gagal atau dibatalkan.'
          : isSuccess 
            ? 'Pembayaran berhasil!'
            : 'Pembayaran masih pending.',
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
