import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/transactions/stats - Get transaction statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const [totalRevenue, byStatus, byMethod] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'PAID' },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { total_amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['payment_method'],
        where: { status: 'PAID' },
        _count: { id: true },
        _sum: { total_amount: true },
      }),
    ]);

    return NextResponse.json({
      total_revenue: totalRevenue._sum.total_amount || 0,
      total_transactions: totalRevenue._count.id,
      by_status: byStatus,
      by_method: byMethod,
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
