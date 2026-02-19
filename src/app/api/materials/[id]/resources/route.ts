import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

// GET /api/materials/[id]/resources - Get material resources
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const resources = await prisma.resource.findMany({
      where: { material_id: id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
