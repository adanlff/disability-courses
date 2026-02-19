// Course Service
import prisma from '@/lib/prisma';
import { CourseStatus, CourseLevel } from '@prisma/client';

// Create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Create course
export async function createCourse(mentorId: string, data: {
  title: string;
  description: string;
  short_description?: string;
  category_id: string;
  level?: CourseLevel;
  language?: string;
  price?: number;
  is_free?: boolean;
  is_premium?: boolean;
  requirements?: string[];
  what_you_will_learn?: string[];
  target_audience?: string[];
  tags?: string[];
}) {
  const slug = createSlug(data.title) + '-' + Date.now().toString(36);

  return prisma.course.create({
    data: {
      mentor_id: mentorId,
      title: data.title,
      slug,
      description: data.description,
      short_description: data.short_description,
      category_id: data.category_id,
      level: data.level || CourseLevel.ALL_LEVELS,
      language: data.language || 'id',
      price: data.price || 0,
      is_free: data.is_free ?? (data.price === 0),
      is_premium: data.is_premium ?? false,
      requirements: data.requirements || [],
      what_you_will_learn: data.what_you_will_learn || [],
      target_audience: data.target_audience || [],
      tags: data.tags || [],
      status: CourseStatus.DRAFT,
    },
  });
}

// Get course by ID
export async function getCourseById(id: string, includeDetails: boolean = false) {
  if (includeDetails) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        mentor: { include: { user: { select: { full_name: true, avatar_url: true } } } },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              orderBy: { order: 'asc' },
              include: { video: { select: { duration: true, status: true } } },
            },
          },
        },
      },
    });
  }
  return prisma.course.findUnique({ where: { id } });
}

// Get course by slug
export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      mentor: { include: { user: { select: { full_name: true, avatar_url: true, bio: true } } } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          materials: { orderBy: { order: 'asc' } },
        },
      },
    },
  });
}

// Update course
export async function updateCourse(id: string, mentorId: string, data: Partial<{
  title: string;
  description: string;
  short_description: string;
  category_id: string;
  level: CourseLevel;
  language: string;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  is_premium: boolean;
  thumbnail: string;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  tags: string[];
}>) {
  const course = await prisma.course.findUnique({ where: { id } });

  if (!course) {
    throw new Error('Kursus tidak ditemukan');
  }

  if (course.mentor_id !== mentorId) {
    throw new Error('Tidak memiliki akses untuk mengubah kursus ini');
  }

  return prisma.course.update({
    where: { id },
    data,
  });
}

// Delete course
export async function deleteCourse(id: string, mentorId: string, isAdmin: boolean = false) {
  const course = await prisma.course.findUnique({ where: { id } });

  if (!course) {
    throw new Error('Kursus tidak ditemukan');
  }

  if (!isAdmin && course.mentor_id !== mentorId) {
    throw new Error('Tidak memiliki akses untuk menghapus kursus ini');
  }

  return prisma.course.delete({ where: { id } });
}

// Get courses with filters
export async function getCourses(options: {
  page?: number;
  limit?: number;
  status?: CourseStatus;
  categoryId?: string;
  level?: CourseLevel;
  isFree?: boolean;
  mentorId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    page = 1,
    limit = 12,
    status,
    categoryId,
    level,
    isFree,
    mentorId,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categoryId) where.category_id = categoryId;
  if (level) where.level = level;
  if (isFree !== undefined) where.is_free = isFree;
  if (mentorId) where.mentor_id = mentorId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        mentor: { include: { user: { select: { full_name: true, avatar_url: true } } } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Submit course for review
export async function submitForReview(id: string, mentorId: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: { sections: { include: { materials: true } } },
  });

  if (!course) {
    throw new Error('Kursus tidak ditemukan');
  }

  if (course.mentor_id !== mentorId) {
    throw new Error('Tidak memiliki akses');
  }

  if (course.sections.length === 0) {
    throw new Error('Kursus harus memiliki minimal 1 section');
  }

  const totalMaterials = course.sections.reduce((sum, s) => sum + s.materials.length, 0);
  if (totalMaterials === 0) {
    throw new Error('Kursus harus memiliki minimal 1 materi');
  }

  return prisma.course.update({
    where: { id },
    data: { status: CourseStatus.PENDING_REVIEW },
  });
}

// Approve course (admin)
export async function approveCourse(id: string) {
  return prisma.course.update({
    where: { id },
    data: { status: CourseStatus.PUBLISHED, published_at: new Date() },
  });
}

// Reject course (admin)
export async function rejectCourse(id: string, reason?: string) {
  await prisma.activityLog.create({
    data: {
      user_id: 'system',
      action: 'course_rejected',
      entity_type: 'course',
      entity_id: id,
      metadata: { reason },
    },
  });

  return prisma.course.update({
    where: { id },
    data: { status: CourseStatus.DRAFT },
  });
}

// Update course statistics
export async function updateCourseStats(courseId: string) {
  const sections = await prisma.section.findMany({
    where: { course_id: courseId },
    include: { materials: { include: { video: true } } },
  });

  let totalDuration = 0;
  let totalLectures = 0;

  sections.forEach(section => {
    section.materials.forEach(material => {
      totalLectures++;
      if (material.video) {
        totalDuration += material.video.duration;
      }
    });
  });

  const totalStudents = await prisma.enrollment.count({
    where: { course_id: courseId },
  });

  const reviews = await prisma.review.findMany({
    where: { course_id: courseId },
    select: { rating: true },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return prisma.course.update({
    where: { id: courseId },
    data: {
      total_duration: totalDuration,
      total_lectures: totalLectures,
      total_students: totalStudents,
      average_rating: averageRating,
      total_reviews: reviews.length,
    },
  });
}
