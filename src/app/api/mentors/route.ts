import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/mentors - List all approved mentors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const expertise = searchParams.get('expertise');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'APPROVED',
    };

    if (search) {
      where.OR = [
        { user: { full_name: { contains: search, mode: 'insensitive' } } },
        { headline: { contains: search, mode: 'insensitive' } },
        { expertise: { has: search } },
      ];
    }

    if (expertise) {
      where.expertise = { has: expertise };
    }

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ average_rating: 'desc' }, { total_students: 'desc' }],
        include: {
          user: {
            select: { id: true, full_name: true, avatar_url: true, bio: true },
          },
          _count: { select: { courses: { where: { status: 'PUBLISHED' } } } },
        },
      }),
      prisma.mentorProfile.count({ where }),
    ]);

    return NextResponse.json({
      mentors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
