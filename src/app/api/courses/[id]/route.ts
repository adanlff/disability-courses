import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole } from '@/lib/auth';
import { updateCourseSchema } from '@/lib/validation';
import { CourseStatus, UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/courses/[id] - Get course by ID or slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const authUser = getAuthUser(request);

    // Try to find by ID or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        mentor: {
          select: {
            id: true,
            headline: true,
            bio: true,
            expertise: true,
            average_rating: true,
            total_students: true,
            total_courses: true,
            user: {
              select: { id: true, full_name: true, avatar_url: true, bio: true },
            },
          },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                content: true,
                video_id: true,
                document_url: true,
                youtube_url: true,
                duration: true,
                order: true,
                is_free: true,
                video: {
                  select: {
                    id: true,
                    status: true,
                    path: true,
                    thumbnail: true,
                  },
                },
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check access for non-published courses
    if (course.status !== CourseStatus.PUBLISHED) {
      if (!authUser) {
        return NextResponse.json(
          { error: 'Kursus tidak ditemukan' },
          { status: 404 }
        );
      }

      const isMentor = course.mentor.user.id === authUser.userId;
      const isAdmin = hasRole(authUser, [UserRole.ADMIN]);

      if (!isMentor && !isAdmin) {
        return NextResponse.json(
          { error: 'Kursus tidak ditemukan' },
          { status: 404 }
        );
      }
    }

    // Increment view count
    await prisma.course.update({
      where: { id: course.id },
      data: { total_views: { increment: 1 } },
    });

    // Check if user is enrolled
    let isEnrolled = false;
    let enrollmentProgress = 0;
    if (authUser) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          user_id_course_id: {
            user_id: authUser.userId,
            course_id: course.id,
          },
        },
      });
      if (enrollment) {
        isEnrolled = true;
        enrollmentProgress = enrollment.progress;
      }
    }

    return NextResponse.json({
      course,
      isEnrolled,
      enrollmentProgress,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find course with mentor info
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        mentor: {
          select: { user_id: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check authorization
    const isMentor = course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const result = updateCourseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // If title changed, update slug
    let slug = course.slug;
    if (data.title && data.title !== course.title) {
      const baseSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      slug = baseSlug;
      let counter = 1;
      while (await prisma.course.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
      include: {
        category: true,
        mentor: {
          include: { user: { select: { full_name: true } } },
        },
      },
    });

    return NextResponse.json({
      message: 'Kursus berhasil diperbarui',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find course with mentor info
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, user_id: true } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kursus tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check authorization
    const isMentor = course.mentor.user_id === authUser.userId;
    const isAdmin = hasRole(authUser, [UserRole.ADMIN]);

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if course has enrollments
    if (course._count.enrollments > 0 && !isAdmin) {
      return NextResponse.json(
        { error: 'Kursus dengan peserta tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Delete course (cascade will handle related records)
    await prisma.course.delete({ where: { id } });

    // Update mentor total courses
    await prisma.mentorProfile.update({
      where: { id: course.mentor.id },
      data: { total_courses: { decrement: 1 } },
    });

    return NextResponse.json({
      message: 'Kursus berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
