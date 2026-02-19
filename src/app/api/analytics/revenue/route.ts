import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/analytics/revenue - Get revenue analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    const [totalRevenue, periodRevenue, byPaymentMethod, topCourses] = await Promise.all([
      prisma.transaction.aggregate({ where: { status: 'PAID' }, _sum: { total_amount: true } }),
      prisma.transaction.aggregate({ where: { status: 'PAID', paid_at: { gte: startDate } }, _sum: { total_amount: true } }),
      prisma.transaction.groupBy({
        by: ['payment_method'],
        where: { status: 'PAID' },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.course.findMany({
        take: 10,
        orderBy: { transactions: { _count: 'desc' } },
        where: { transactions: { some: { status: 'PAID' } } },
        select: {
          id: true, title: true,
          _count: { select: { transactions: { where: { status: 'PAID' } } } },
          transactions: { where: { status: 'PAID' }, select: { total_amount: true } },
        },
      }),
    ]);

    return NextResponse.json({
      total_revenue: totalRevenue._sum.total_amount || 0,
      period_revenue: periodRevenue._sum.total_amount || 0,
      by_payment_method: byPaymentMethod,
      top_courses: topCourses.map(c => ({
        id: c.id,
        title: c.title,
        transactions: c._count.transactions,
        revenue: c.transactions.reduce((sum, t) => sum + t.total_amount, 0),
      })),
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
