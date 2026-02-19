import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/users/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: authUser.userId },
      orderBy: { created_at: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            discount_price: true,
            is_free: true,
            average_rating: true,
            total_students: true,
            mentor: {
              select: {
                user: { select: { full_name: true, avatar_url: true } },
              },
            },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/users/wishlist - Add course to wishlist
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID wajib diisi' }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: course_id },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan' }, { status: 404 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Kursus sudah ada di wishlist' }, { status: 400 });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: authUser.userId,
        course_id,
      },
    });

    return NextResponse.json(
      { message: 'Kursus ditambahkan ke wishlist', wishlist: wishlistItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add wishlist error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
