// Recommendation Service
import prisma from '@/lib/prisma';
import { CourseStatus, MentorStatus } from '@prisma/client';

// Get recommended courses for user
export async function getRecommendedCourses(
  userId: string | null,
  options: { limit?: number; excludeEnrolled?: boolean } = {}
) {
  const { limit = 10, excludeEnrolled = true } = options;

  let enrolledCourseIds: string[] = [];
  let preferredCategories: string[] = [];

  if (userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: userId },
      select: {
        course_id: true,
        course: { select: { category_id: true } },
      },
    });

    enrolledCourseIds = enrollments.map(e => e.course_id);
    preferredCategories = Array.from(new Set(enrollments.map(e => e.course.category_id)));
  }

  const where: Record<string, unknown> = {
    status: CourseStatus.PUBLISHED,
  };

  if (excludeEnrolled && enrolledCourseIds.length > 0) {
    where.id = { notIn: enrolledCourseIds };
  }

  // Prioritize preferred categories
  if (preferredCategories.length > 0) {
    where.category_id = { in: preferredCategories };
  }

  let courses = await prisma.course.findMany({
    where,
    orderBy: [
      { is_featured: 'desc' },
      { average_rating: 'desc' },
      { total_students: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      short_description: true,
      price: true,
      discount_price: true,
      is_free: true,
      level: true,
      average_rating: true,
      total_students: true,
      mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
      category: { select: { name: true, slug: true } },
    },
  });

  // If not enough from preferred categories, get more
  if (courses.length < limit && preferredCategories.length > 0) {
    const additionalCourses = await prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        id: { notIn: [...enrolledCourseIds, ...courses.map(c => c.id)] },
      },
      orderBy: [{ is_featured: 'desc' }, { average_rating: 'desc' }],
      take: limit - courses.length,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        short_description: true,
        price: true,
        discount_price: true,
        is_free: true,
        level: true,
        average_rating: true,
        total_students: true,
        mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
        category: { select: { name: true, slug: true } },
      },
    });

    courses = [...courses, ...additionalCourses];
  }

  return { courses, personalized: userId !== null };
}

// Get recommended mentors
export async function getRecommendedMentors(
  userId: string | null,
  options: { limit?: number; expertise?: string } = {}
) {
  const { limit = 10, expertise } = options;

  const where: Record<string, unknown> = {
    status: MentorStatus.APPROVED,
  };

  if (expertise) {
    where.expertise = { has: expertise };
  }

  const mentors = await prisma.mentorProfile.findMany({
    where,
    orderBy: [
      { average_rating: 'desc' },
      { total_students: 'desc' },
      { total_courses: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      expertise: true,
      experience: true,
      total_students: true,
      total_courses: true,
      average_rating: true,
      user: {
        select: { id: true, full_name: true, avatar_url: true, bio: true },
      },
    },
  });

  return { mentors, personalized: userId !== null };
}

// Get similar courses
export async function getSimilarCourses(courseId: string, limit: number = 5) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { category_id: true, tags: true, level: true },
  });

  if (!course) return [];

  const similarCourses = await prisma.course.findMany({
    where: {
      id: { not: courseId },
      status: CourseStatus.PUBLISHED,
      OR: [
        { category_id: course.category_id },
        { tags: { hasSome: course.tags } },
        { level: course.level },
      ],
    },
    orderBy: { average_rating: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      price: true,
      is_free: true,
      average_rating: true,
      mentor: { select: { user: { select: { full_name: true } } } },
    },
  });

  return similarCourses;
}

// Get trending courses
export async function getTrendingCourses(limit: number = 10) {
  // Trending based on recent enrollments
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const enrollmentCounts = await prisma.enrollment.groupBy({
    by: ['course_id'],
    where: { created_at: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const sortedEnrollments = enrollmentCounts
    .sort((a, b) => b._count - a._count)
    .slice(0, limit);

  const courseIds = sortedEnrollments.map(e => e.course_id);

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, status: CourseStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      price: true,
      is_free: true,
      average_rating: true,
      total_students: true,
      mentor: { select: { user: { select: { full_name: true } } } },
    },
  });

  return courses;
}

// Get featured courses
export async function getFeaturedCourses(limit: number = 6) {
  return prisma.course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
      is_featured: true,
    },
    orderBy: { average_rating: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      short_description: true,
      price: true,
      is_free: true,
      average_rating: true,
      total_students: true,
      mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
      category: { select: { name: true } },
    },
  });
}
