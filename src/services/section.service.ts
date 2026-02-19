// Section Service
import prisma from '@/lib/prisma';

// Create section
export async function createSection(courseId: string, data: {
  title: string;
  description?: string;
  order?: number;
}) {
  // Get next order if not specified
  let order = data.order;
  if (order === undefined) {
    const lastSection = await prisma.section.findFirst({
      where: { course_id: courseId },
      orderBy: { order: 'desc' },
    });
    order = (lastSection?.order || 0) + 1;
  }

  return prisma.section.create({
    data: {
      course_id: courseId,
      title: data.title,
      description: data.description,
      order,
    },
  });
}

// Get section by ID
export async function getSectionById(id: string) {
  return prisma.section.findUnique({
    where: { id },
    include: {
      materials: {
        orderBy: { order: 'asc' },
        include: { video: { select: { duration: true, status: true } } },
      },
      course: { select: { mentor_id: true } },
    },
  });
}

// Update section
export async function updateSection(id: string, data: Partial<{
  title: string;
  description: string;
  order: number;
}>) {
  return prisma.section.update({
    where: { id },
    data,
  });
}

// Delete section
export async function deleteSection(id: string) {
  return prisma.section.delete({ where: { id } });
}

// Get course sections
export async function getCourseSections(courseId: string) {
  return prisma.section.findMany({
    where: { course_id: courseId },
    include: {
      materials: {
        orderBy: { order: 'asc' },
        include: { video: { select: { duration: true, status: true, thumbnail: true } } },
      },
    },
    orderBy: { order: 'asc' },
  });
}

// Reorder sections
export async function reorderSections(courseId: string, sectionOrders: { id: string; order: number }[]) {
  const updates = sectionOrders.map(item =>
    prisma.section.update({
      where: { id: item.id },
      data: { order: item.order },
    })
  );

  return prisma.$transaction(updates);
}

// Get section statistics
export async function getSectionStats(sectionId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      materials: { include: { video: true } },
    },
  });

  if (!section) return null;

  const totalMaterials = section.materials.length;
  const totalDuration = section.materials.reduce((sum, m) => {
    return sum + (m.video?.duration || 0);
  }, 0);

  const videoCount = section.materials.filter(m => m.type === 'VIDEO').length;
  const documentCount = section.materials.filter(m => m.type === 'DOCUMENT').length;
  const quizCount = section.materials.filter(m => m.type === 'QUIZ').length;

  return {
    total_materials: totalMaterials,
    total_duration: totalDuration,
    video_count: videoCount,
    document_count: documentCount,
    quiz_count: quizCount,
  };
}

// Duplicate section
export async function duplicateSection(sectionId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { materials: true },
  });

  if (!section) throw new Error('Section tidak ditemukan');

  // Get next order
  const lastSection = await prisma.section.findFirst({
    where: { course_id: section.course_id },
    orderBy: { order: 'desc' },
  });

  const newSection = await prisma.section.create({
    data: {
      course_id: section.course_id,
      title: `${section.title} (Copy)`,
      description: section.description,
      order: (lastSection?.order || 0) + 1,
    },
  });

  // Duplicate materials
  for (const material of section.materials) {
    await prisma.material.create({
      data: {
        section_id: newSection.id,
        title: material.title,
        type: material.type,
        content: material.content,
        duration: material.duration,
        order: material.order,
        is_free: material.is_free,
      },
    });
  }

  return newSection;
}
