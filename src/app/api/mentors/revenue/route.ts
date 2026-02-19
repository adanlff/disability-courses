import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// GET /api/mentors/revenue - Get mentor's revenue statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.MENTOR, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { user_id: authUser.userId },
      select: { id: true, total_revenue: true },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Profil mentor tidak ditemukan' }, { status: 404 });
    }

    // Get revenue by month (include both PAID and SUCCESS status)
    const transactions = await prisma.transaction.findMany({
      where: {
        course: { mentor_id: mentorProfile.id },
        status: { in: ['PAID', 'SUCCESS'] },
      },
      select: { total_amount: true, paid_at: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);

    // Group by month (use paid_at if available, otherwise created_at)
    const monthlyRevenue: Record<string, number> = {};
    transactions.forEach(t => {
      const date = t.paid_at || t.created_at;
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + t.total_amount;
      }
    });

    return NextResponse.json({
      total_revenue: totalRevenue,
      transactions_count: transactions.length,
      monthly_revenue: monthlyRevenue,
    });
  } catch (error) {
    console.error('Get mentor revenue error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
