// Transaction Service
import prisma from '@/lib/prisma';
import { TransactionStatus, PaymentMethod, CourseStatus, EnrollmentStatus } from '@prisma/client';

// Generate order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Create transaction
export async function createTransaction(
  userId: string,
  courseId: string,
  paymentMethod: PaymentMethod
) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kursus tidak ditemukan');
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new Error('Kursus tidak tersedia');
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });

  if (existingEnrollment) {
    throw new Error('Anda sudah terdaftar di kursus ini');
  }

  // Check for pending transaction
  const pendingTransaction = await prisma.transaction.findFirst({
    where: {
      user_id: userId,
      course_id: courseId,
      status: TransactionStatus.PENDING,
    },
  });

  if (pendingTransaction) {
    return pendingTransaction;
  }

  const amount = course.price;
  const discount = course.discount_price ? course.price - course.discount_price : 0;
  const totalAmount = course.discount_price || course.price;

  const transaction = await prisma.transaction.create({
    data: {
      user_id: userId,
      course_id: courseId,
      order_id: generateOrderId(),
      amount,
      discount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      status: TransactionStatus.PENDING,
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // TODO: Create payment with payment gateway
  // const paymentUrl = await createPayment(transaction);

  return {
    ...transaction,
    payment_url: `/payment/${transaction.order_id}`,
  };
}

// Get transaction by ID
export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      user: { select: { full_name: true, email: true } },
      course: { select: { title: true, slug: true, thumbnail: true } },
    },
  });
}

// Get transaction by order ID
export async function getTransactionByOrderId(orderId: string) {
  return prisma.transaction.findUnique({
    where: { order_id: orderId },
    include: {
      user: { select: { full_name: true, email: true } },
      course: { select: { title: true, slug: true, thumbnail: true } },
    },
  });
}

// Update transaction status (webhook)
export async function updateTransactionStatus(
  orderId: string,
  status: TransactionStatus,
  metadata?: Record<string, unknown>
) {
  const transaction = await prisma.transaction.findUnique({
    where: { order_id: orderId },
  });

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan');
  }

  const updateData: Record<string, unknown> = { status };

  if (status === TransactionStatus.PAID) {
    updateData.paid_at = new Date();
  }

  if (metadata) {
    updateData.metadata = metadata as object;
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { order_id: orderId },
    data: updateData,
  });

  // If paid, create enrollment
  if (status === TransactionStatus.PAID) {
    await prisma.enrollment.create({
      data: {
        user_id: transaction.user_id,
        course_id: transaction.course_id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Update course student count
    await prisma.course.update({
      where: { id: transaction.course_id },
      data: { total_students: { increment: 1 } },
    });
  }

  return updatedTransaction;
}

// Get user transactions
export async function getUserTransactions(userId: string, options: {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
} = {}) {
  const { page = 1, limit = 10, status } = options;

  const where: { user_id: string; status?: TransactionStatus } = { user_id: userId };
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        course: { select: { title: true, slug: true, thumbnail: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Cancel transaction
export async function cancelTransaction(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan');
  }

  if (transaction.user_id !== userId) {
    throw new Error('Tidak memiliki akses');
  }

  if (transaction.status !== TransactionStatus.PENDING) {
    throw new Error('Transaksi tidak dapat dibatalkan');
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status: TransactionStatus.CANCELLED },
  });
}

// Get admin transaction stats
export async function getTransactionStats(startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) (where.created_at as Record<string, Date>).gte = startDate;
    if (endDate) (where.created_at as Record<string, Date>).lte = endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where: { ...where, status: TransactionStatus.PAID },
    select: { total_amount: true, payment_method: true },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const transactionCount = transactions.length;

  const byPaymentMethod: Record<string, { count: number; amount: number }> = {};
  transactions.forEach(t => {
    if (!byPaymentMethod[t.payment_method]) {
      byPaymentMethod[t.payment_method] = { count: 0, amount: 0 };
    }
    byPaymentMethod[t.payment_method].count++;
    byPaymentMethod[t.payment_method].amount += t.total_amount;
  });

  return {
    total_revenue: totalRevenue,
    transaction_count: transactionCount,
    average_transaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
    by_payment_method: byPaymentMethod,
  };
}
