import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, TransactionStatus, EnrollmentStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/transactions/[id] - Get transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        course: { include: { mentor: { include: { user: { select: { full_name: true } } } } } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/admin/transactions/[id] - Update transaction status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(TransactionStatus).includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        status,
        paid_at: status === TransactionStatus.PAID ? new Date() : undefined,
      },
    });

    // If marking as paid, create enrollment
    if (status === TransactionStatus.PAID && transaction.status !== TransactionStatus.PAID) {
      await prisma.enrollment.create({
        data: {
          user_id: transaction.user_id,
          course_id: transaction.course_id,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      await prisma.course.update({
        where: { id: transaction.course_id },
        data: { total_students: { increment: 1 } },
      });
    }

    return NextResponse.json({ message: 'Status transaksi berhasil diperbarui', transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
