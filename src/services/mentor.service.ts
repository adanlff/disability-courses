// Mentor Service
import prisma from '@/lib/prisma';
import { MentorStatus, UserRole } from '@prisma/client';

// Apply to become mentor
export async function applyAsMentor(userId: string, data: {
  expertise: string[];
  experience: number;
  education?: string;
  bio?: string;
  headline?: string;
  website?: string;
  linkedin?: string;
  portfolio?: string;
}) {
  // Check if already has mentor profile
  const existingProfile = await prisma.mentorProfile.findUnique({
    where: { user_id: userId },
  });

  if (existingProfile) {
    throw new Error('Anda sudah mengajukan permohonan menjadi mentor');
  }

  const mentorProfile = await prisma.mentorProfile.create({
    data: {
      user_id: userId,
      expertise: data.expertise,
      experience: data.experience,
      education: data.education,
      bio: data.bio,
      headline: data.headline,
      website: data.website,
      linkedin: data.linkedin,
      portfolio: data.portfolio,
      status: MentorStatus.PENDING,
    },
  });

  return mentorProfile;
}

// Get mentor profile by user ID
export async function getMentorProfileByUserId(userId: string) {
  return prisma.mentorProfile.findUnique({
    where: { user_id: userId },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          avatar_url: true,
          bio: true,
        },
      },
    },
  });
}

// Get mentor profile by ID
export async function getMentorProfileById(mentorId: string) {
  return prisma.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          avatar_url: true,
          bio: true,
        },
      },
      courses: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          average_rating: true,
          total_students: true,
        },
      },
    },
  });
}

// Update mentor profile
export async function updateMentorProfile(userId: string, data: Partial<{
  expertise: string[];
  experience: number;
  education: string | null;
  bio: string | null;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  portfolio: string | null;
}>) {
  return prisma.mentorProfile.update({
    where: { user_id: userId },
    data,
  });
}

// Approve mentor application (admin)
export async function approveMentor(mentorId: string) {
  const mentor = await prisma.mentorProfile.findUnique({
    where: { id: mentorId },
  });

  if (!mentor) {
    throw new Error('Mentor tidak ditemukan');
  }

  const [updatedMentor] = await prisma.$transaction([
    prisma.mentorProfile.update({
      where: { id: mentorId },
      data: {
        status: MentorStatus.APPROVED,
        approved_at: new Date(),
        rejection_reason: null,
      },
    }),
    prisma.user.update({
      where: { id: mentor.user_id },
      data: { role: UserRole.MENTOR },
    }),
  ]);

  return updatedMentor;
}

// Reject mentor application (admin)
export async function rejectMentor(mentorId: string, reason?: string) {
  return prisma.mentorProfile.update({
    where: { id: mentorId },
    data: {
      status: MentorStatus.REJECTED,
      rejected_at: new Date(),
      rejection_reason: reason,
    },
  });
}

// Get pending mentor applications (admin)
export async function getPendingMentors(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 10 } = options;

  const where = { status: MentorStatus.PENDING };

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      include: {
        user: { select: { full_name: true, email: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  return { mentors, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get all mentors with filters
export async function getMentors(options: {
  page?: number;
  limit?: number;
  status?: MentorStatus;
  expertise?: string;
  search?: string;
} = {}) {
  const { page = 1, limit = 10, status, expertise, search } = options;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (expertise) where.expertise = { has: expertise };
  if (search) {
    where.user = {
      OR: [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      include: {
        user: { select: { full_name: true, email: true, avatar_url: true, bio: true } },
      },
      orderBy: { average_rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  return { mentors, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Update mentor statistics
export async function updateMentorStats(mentorId: string) {
  const courses = await prisma.course.findMany({
    where: { mentor_id: mentorId, status: 'PUBLISHED' },
    select: { total_students: true, average_rating: true, total_reviews: true },
  });

  const totalStudents = courses.reduce((sum, c) => sum + c.total_students, 0);
  const totalCourses = courses.length;

  const totalReviews = courses.reduce((sum, c) => sum + c.total_reviews, 0);
  const weightedRating = courses.reduce((sum, c) => sum + c.average_rating * c.total_reviews, 0);
  const averageRating = totalReviews > 0 ? weightedRating / totalReviews : 0;

  return prisma.mentorProfile.update({
    where: { id: mentorId },
    data: {
      total_students: totalStudents,
      total_courses: totalCourses,
      average_rating: averageRating,
    },
  });
}
