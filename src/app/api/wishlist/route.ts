import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: authUser.userId },
      include: {
        course: {
          include: {
            category: true,
            mentor: {
              include: {
                user: { select: { full_name: true } },
              },
            },
            _count: {
              select: { enrollments: true, reviews: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      wishlist,
      total: wishlist.length,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json({ error: 'Gagal mengambil wishlist' }, { status: 500 });
  }
}

// POST /api/wishlist - Add course to wishlist
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID diperlukan' }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: course_id },
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

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: authUser.userId,
        course_id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kursus berhasil ditambahkan ke wishlist',
      wishlist: wishlistItem,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan ke wishlist' }, { status: 500 });
  }
}

// DELETE /api/wishlist - Remove course from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID diperlukan' }, { status: 400 });
    }

    // Find wishlist item
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: courseId,
        },
      },
    });

    if (!wishlistItem) {
      return NextResponse.json({ error: 'Item tidak ditemukan di wishlist' }, { status: 404 });
    }

    // Delete from wishlist
    await prisma.wishlist.delete({
      where: { id: wishlistItem.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Kursus berhasil dihapus dari wishlist',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json({ error: 'Gagal menghapus dari wishlist' }, { status: 500 });
  }
}
