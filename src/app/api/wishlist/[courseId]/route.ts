import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { courseId: string };
}

// GET /api/wishlist/[courseId] - Check if course is in wishlist
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { courseId } = params;

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        user_id_course_id: {
          user_id: authUser.userId,
          course_id: courseId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      inWishlist: !!wishlistItem,
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return NextResponse.json({ error: 'Gagal memeriksa wishlist' }, { status: 500 });
  }
}

// DELETE /api/wishlist/[courseId] - Remove specific course from wishlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { courseId } = params;

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
