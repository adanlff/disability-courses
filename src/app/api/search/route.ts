import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search - Global search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all';

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Kata kunci minimal 2 karakter' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const results: Record<string, unknown> = {};

    if (type === 'all' || type === 'courses') {
      const courses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.toLowerCase() } },
          ],
        },
        take: type === 'all' ? 5 : limit,
        skip: type === 'courses' ? skip : 0,
        select: {
          id: true, title: true, slug: true, thumbnail: true, price: true, average_rating: true, total_students: true,
          mentor: { select: { user: { select: { full_name: true } } } },
          category: { select: { name: true } },
        },
      });
      results.courses = courses;
    }

    if (type === 'all' || type === 'mentors') {
      const mentors = await prisma.mentorProfile.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { user: { full_name: { contains: q, mode: 'insensitive' } } },
            { headline: { contains: q, mode: 'insensitive' } },
            { expertise: { has: q } },
          ],
        },
        take: type === 'all' ? 5 : limit,
        skip: type === 'mentors' ? skip : 0,
        select: {
          id: true, headline: true, expertise: true, average_rating: true, total_students: true,
          user: { select: { id: true, full_name: true, avatar_url: true } },
        },
      });
      results.mentors = mentors;
    }

    return NextResponse.json({ query: q, results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
