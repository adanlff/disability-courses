import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth';

interface RouteParams {
  params: { courseId: string };
}

// DELETE /api/users/wishlist/[courseId] - Remove from wishlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { courseId } = params;

    const deleted = await prisma.wishlist.deleteMany({
      where: {
        user_id: authUser.userId,
        course_id: courseId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan di wishlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Kursus dihapus dari wishlist' });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
