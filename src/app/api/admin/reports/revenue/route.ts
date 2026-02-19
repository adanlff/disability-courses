import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { UserRole, TransactionStatus } from '@prisma/client';

// GET /api/admin/reports/revenue - Revenue reports and analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range
    const now = new Date();
    let dateFrom = new Date();
    
    switch (period) {
      case 'week': dateFrom.setDate(now.getDate() - 7); break;
      case 'month': dateFrom.setMonth(now.getMonth() - 1); break;
      case 'quarter': dateFrom.setMonth(now.getMonth() - 3); break;
      case 'year': dateFrom.setFullYear(now.getFullYear() - 1); break;
    }

    // Get paid/success transactions in period (include both PAID and SUCCESS for free courses)
    const transactions = await prisma.transaction.findMany({
      where: {
        status: { in: [TransactionStatus.PAID, TransactionStatus.SUCCESS] },
        OR: [
          { paid_at: { gte: dateFrom, lte: now } },
          { created_at: { gte: dateFrom, lte: now }, paid_at: null },
        ],
      },
      select: {
        amount: true,
        discount: true,
        total_amount: true,
        paid_at: true,
        created_at: true,
        payment_method: true,
        course_id: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0);

    // Group by day (use paid_at if available, otherwise created_at)
    const revenueByDay = new Map<string, { revenue: number; transactions: number }>();
    transactions.forEach(t => {
      const date = t.paid_at || t.created_at;
      if (date) {
        const day = date.toISOString().split('T')[0];
        const existing = revenueByDay.get(day) || { revenue: 0, transactions: 0 };
        existing.revenue += t.total_amount;
        existing.transactions += 1;
        revenueByDay.set(day, existing);
      }
    });

    // Group by payment method
    const byPaymentMethod: Record<string, number> = {};
    transactions.forEach(t => {
      byPaymentMethod[t.payment_method] = (byPaymentMethod[t.payment_method] || 0) + t.total_amount;
    });

    // Group by course
    const courseRevenue = new Map<string, { revenue: number; transactions: number }>();
    transactions.forEach(t => {
      const existing = courseRevenue.get(t.course_id) || { revenue: 0, transactions: 0 };
      existing.revenue += t.total_amount;
      existing.transactions += 1;
      courseRevenue.set(t.course_id, existing);
    });

    // Get top courses
    const topCourseEntries = Array.from(courseRevenue.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);

    const topCourseIds = topCourseEntries.map(([id]) => id);
    const courseDetails = await prisma.course.findMany({
      where: { id: { in: topCourseIds } },
      select: { id: true, title: true },
    });

    const courseMap = new Map(courseDetails.map(c => [c.id, c.title]));

    return NextResponse.json({
      period,
      date_range: { from: dateFrom, to: now },
      summary: {
        total_revenue: totalRevenue,
        total_discount: totalDiscount,
        total_transactions: transactions.length,
        average_transaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      },
      trend: Array.from(revenueByDay.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        transactions: data.transactions,
      })),
      by_payment_method: Object.entries(byPaymentMethod).map(([method, amount]) => ({
        method,
        amount,
      })),
      top_courses: topCourseEntries.map(([id, data]) => ({
        course_id: id,
        course_title: courseMap.get(id) || 'Unknown',
        revenue: data.revenue,
        transactions: data.transactions,
      })),
    });
  } catch (error) {
    console.error('Get revenue reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
