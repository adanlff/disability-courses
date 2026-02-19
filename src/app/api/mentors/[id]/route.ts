import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/mentors/[id] - Get mentor by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const mentor = await prisma.mentorProfile.findFirst({
      where: {
        OR: [{ id }, { user_id: id }],
        status: 'APPROVED',
      },
      include: {
        user: {
          select: { id: true, full_name: true, avatar_url: true, bio: true },
        },
        courses: {
          where: { status: 'PUBLISHED' },
          take: 6,
          orderBy: { total_students: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            discount_price: true,
            average_rating: true,
            total_students: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ mentor });
  } catch (error) {
    console.error('Get mentor error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
