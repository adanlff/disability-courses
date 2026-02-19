// User Service
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus, DisabilityType } from '@prisma/client';

// Get user by ID
export async function getUserById(id: string, includePrivate: boolean = false) {
  const select = {
    id: true,
    email: true,
    full_name: true,
    role: true,
    status: true,
    avatar_url: true,
    bio: true,
    phone: includePrivate,
    date_of_birth: includePrivate,
    address: includePrivate,
    city: includePrivate,
    disability_type: true,
    email_verified: includePrivate,
    created_at: true,
    last_login: includePrivate,
  };

  return prisma.user.findUnique({
    where: { id },
    select,
  });
}

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Update user profile
export async function updateProfile(userId: string, data: Partial<{
  full_name: string;
  bio: string | null;
  phone: string | null;
  date_of_birth: Date | null;
  address: string | null;
  city: string | null;
  disability_type: DisabilityType | null;
}>) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      avatar_url: true,
      bio: true,
      phone: true,
      date_of_birth: true,
      address: true,
      city: true,
      disability_type: true,
    },
  });
}

// Update avatar
export async function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatar_url: avatarUrl },
    select: { id: true, avatar_url: true },
  });
}

// Get users (admin)
export async function getUsers(options: {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
} = {}) {
  const { page = 1, limit = 10, role, status, search } = options;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        avatar_url: true,
        created_at: true,
        last_login: true,
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Update user status (admin)
export async function updateUserStatus(userId: string, status: UserStatus) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

// Update user role (admin)
export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

// Delete user (admin)
export async function deleteUser(userId: string) {
  return prisma.user.delete({
    where: { id: userId },
  });
}

// Get user stats
export async function getUserStats(userId: string) {
  const [enrollments, certificates, reviews] = await Promise.all([
    prisma.enrollment.count({ where: { user_id: userId } }),
    prisma.certificate.count({ where: { user_id: userId } }),
    prisma.review.count({ where: { user_id: userId } }),
  ]);

  const completedCourses = await prisma.enrollment.count({
    where: { user_id: userId, status: 'COMPLETED' },
  });

  return {
    total_enrollments: enrollments,
    completed_courses: completedCourses,
    certificates: certificates,
    reviews_given: reviews,
  };
}

// Check if email exists
export async function emailExists(email: string, excludeUserId?: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return false;
  if (excludeUserId && user.id === excludeUserId) return false;
  return true;
}

// Update password
export async function updatePassword(userId: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

// Get user activity
export async function getUserActivity(userId: string, limit: number = 10) {
  return prisma.activityLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

// Add to wishlist
export async function addToWishlist(userId: string, courseId: string) {
  const existing = await prisma.wishlist.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });

  if (existing) {
    throw new Error('Kursus sudah ada di wishlist');
  }

  return prisma.wishlist.create({
    data: { user_id: userId, course_id: courseId },
  });
}

// Remove from wishlist
export async function removeFromWishlist(userId: string, courseId: string) {
  return prisma.wishlist.delete({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
}

// Get user wishlist
export async function getWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { user_id: userId },
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
          mentor: { select: { user: { select: { full_name: true } } } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}
