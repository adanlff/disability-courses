// Material Service
import prisma from '@/lib/prisma';
import { MaterialType } from '@prisma/client';

// Create material
export async function createMaterial(sectionId: string, data: {
  title: string;
  type: MaterialType;
  content?: string;
  duration?: number;
  order?: number;
  is_free?: boolean;
}) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    throw new Error('Section tidak ditemukan');
  }

  // Get next order if not specified
  let order = data.order;
  if (order === undefined) {
    const lastMaterial = await prisma.material.findFirst({
      where: { section_id: sectionId },
      orderBy: { order: 'desc' },
    });
    order = (lastMaterial?.order || 0) + 1;
  }

  return prisma.material.create({
    data: {
      section_id: sectionId,
      title: data.title,
      type: data.type,
      content: data.content,
      duration: data.duration || 0,
      order,
      is_free: data.is_free || false,
    },
  });
}

// Get material by ID
export async function getMaterialById(id: string) {
  return prisma.material.findUnique({
    where: { id },
    include: {
      section: {
        include: { course: { select: { mentor_id: true } } },
      },
      video: true,
    },
  });
}

// Update material
export async function updateMaterial(id: string, data: Partial<{
  title: string;
  type: MaterialType;
  content: string;
  duration: number;
  order: number;
  is_free: boolean;
}>) {
  return prisma.material.update({
    where: { id },
    data,
  });
}

// Delete material
export async function deleteMaterial(id: string) {
  return prisma.material.delete({ where: { id } });
}

// Reorder materials
export async function reorderMaterials(sectionId: string, materialOrders: { id: string; order: number }[]) {
  const updates = materialOrders.map(item =>
    prisma.material.update({
      where: { id: item.id },
      data: { order: item.order },
    })
  );

  return prisma.$transaction(updates);
}

// Get section materials
export async function getSectionMaterials(sectionId: string) {
  return prisma.material.findMany({
    where: { section_id: sectionId },
    include: { video: { select: { duration: true, status: true, thumbnail: true } } },
    orderBy: { order: 'asc' },
  });
}

// Link video to material
export async function linkVideoToMaterial(materialId: string, videoId: string) {
  return prisma.material.update({
    where: { id: materialId },
    data: { video_id: videoId },
  });
}

// Get free preview materials
export async function getFreePreviewMaterials(courseId: string) {
  return prisma.material.findMany({
    where: {
      is_free: true,
      section: { course_id: courseId },
    },
    include: { video: { select: { duration: true, thumbnail: true } } },
    orderBy: { order: 'asc' },
  });
}
