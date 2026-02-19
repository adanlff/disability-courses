import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, hasRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { createCategorySchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

// GET /api/admin/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { courses: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    if (!hasRole(authUser, [UserRole.ADMIN])) return forbiddenResponse();

    const body = await request.json();
    const result = createCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const slug = result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await prisma.category.create({
      data: { ...result.data, slug },
    });

    return NextResponse.json({ message: 'Kategori berhasil dibuat', category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
