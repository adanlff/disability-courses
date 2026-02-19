// Enrollment Service
import prisma from '@/lib/prisma';
import { EnrollmentStatus, CourseStatus } from '@prisma/client';

// Enroll user in course
export async function enrollUser(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kursus tidak ditemukan');
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new Error('Kursus tidak tersedia');
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });

  if (existingEnrollment) {
    throw new Error('Anda sudah terdaftar di kursus ini');
  }

  // For free courses, enroll directly
  // For paid courses, enrollment happens after payment confirmation
  if (!course.is_free && course.price > 0) {
    throw new Error('Silakan lakukan pembayaran terlebih dahulu');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      user_id: userId,
      course_id: courseId,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  // Update course student count
  await prisma.course.update({
    where: { id: courseId },
    data: { total_students: { increment: 1 } },
  });

  return enrollment;
}

// Get user enrollments
export async function getUserEnrollments(userId: string, options: {
  page?: number;
  limit?: number;
  status?: EnrollmentStatus;
} = {}) {
  const { page = 1, limit = 10, status } = options;

  const where: { user_id: string; status?: EnrollmentStatus } = { user_id: userId };
  if (status) where.status = status;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            mentor: { include: { user: { select: { full_name: true } } } },
          },
        },
        certificate: { select: { id: true, certificate_number: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.enrollment.count({ where }),
  ]);

  return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get enrollment by ID
export async function getEnrollmentById(enrollmentId: string) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: { materials: { orderBy: { order: 'asc' } } },
          },
        },
      },
      progress_records: true,
      certificate: true,
    },
  });
}

// Check if user is enrolled
export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  return !!enrollment;
}

// Get enrollment for user and course
export async function getEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    include: {
      progress_records: true,
      certificate: true,
    },
  });
}

// Update enrollment progress
export async function updateProgress(
  enrollmentId: string,
  materialId: string,
  userId: string,
  data: {
    is_completed?: boolean;
    watched_duration?: number;
    last_position?: number;
  }
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment || enrollment.user_id !== userId) {
    throw new Error('Enrollment tidak ditemukan');
  }

  const progress = await prisma.progress.upsert({
    where: {
      enrollment_id_material_id: {
        enrollment_id: enrollmentId,
        material_id: materialId,
      },
    },
    update: {
      ...data,
      completed_at: data.is_completed ? new Date() : undefined,
    },
    create: {
      enrollment_id: enrollmentId,
      material_id: materialId,
      user_id: userId,
      is_completed: data.is_completed || false,
      watched_duration: data.watched_duration || 0,
      last_position: data.last_position || 0,
      completed_at: data.is_completed ? new Date() : undefined,
    },
  });

  // Calculate overall progress
  await updateEnrollmentProgress(enrollmentId);

  return progress;
}

// Calculate and update overall enrollment progress
export async function updateEnrollmentProgress(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          sections: {
            include: { materials: true },
          },
        },
      },
      progress_records: true,
    },
  });

  if (!enrollment) return;

  const totalMaterials = enrollment.course.sections.reduce(
    (sum, section) => sum + section.materials.length,
    0
  );

  const completedMaterials = enrollment.progress_records.filter(p => p.is_completed).length;

  const progressPercentage = totalMaterials > 0
    ? Math.round((completedMaterials / totalMaterials) * 100)
    : 0;

  const isCompleted = progressPercentage >= 100;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: progressPercentage,
      status: isCompleted ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
      completed_at: isCompleted ? new Date() : undefined,
      last_accessed_at: new Date(),
    },
  });
}

// Get continue learning items
export async function getContinueLearning(userId: string, limit: number = 5) {
  return prisma.enrollment.findMany({
    where: {
      user_id: userId,
      status: EnrollmentStatus.ACTIVE,
      progress: { lt: 100 },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { last_accessed_at: 'desc' },
    take: limit,
  });
}
