// Comment Service
import prisma from '@/lib/prisma';

// Create comment
export async function createComment(data: {
  userId: string;
  materialId: string;
  content: string;
  parentId?: string;
}) {
  const material = await prisma.material.findUnique({
    where: { id: data.materialId },
    include: { section: { include: { course: true } } },
  });

  if (!material) {
    throw new Error('Materi tidak ditemukan');
  }

  // Check if user is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      user_id_course_id: {
        user_id: data.userId,
        course_id: material.section.course_id,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Anda harus terdaftar di kursus ini untuk berkomentar');
  }

  return prisma.comment.create({
    data: {
      user_id: data.userId,
      material_id: data.materialId,
      content: data.content,
      parent_id: data.parentId,
    },
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  });
}

// Get comments for material
export async function getMaterialComments(
  materialId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;

  const where = { material_id: materialId, parent_id: null };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, full_name: true, avatar_url: true } },
        replies: {
          include: {
            user: { select: { id: true, full_name: true, avatar_url: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Update comment
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Komentar tidak ditemukan');
  }

  if (comment.user_id !== userId) {
    throw new Error('Tidak memiliki akses untuk mengubah komentar ini');
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  });
}

// Delete comment
export async function deleteComment(commentId: string, userId: string, isAdmin: boolean = false) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Komentar tidak ditemukan');
  }

  if (!isAdmin && comment.user_id !== userId) {
    throw new Error('Tidak memiliki akses untuk menghapus komentar ini');
  }

  // Delete replies first
  await prisma.comment.deleteMany({
    where: { parent_id: commentId },
  });

  return prisma.comment.delete({
    where: { id: commentId },
  });
}

// Get comment by ID
export async function getCommentById(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true } },
      replies: {
        include: {
          user: { select: { id: true, full_name: true, avatar_url: true } },
        },
      },
    },
  });
}
