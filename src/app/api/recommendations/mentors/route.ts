import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { MentorStatus, CourseStatus } from '@prisma/client';

// GET /api/recommendations/mentors - Get recommended mentors
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const expertise = searchParams.get('expertise');

    // Build where clause
    const whereClause: { status: MentorStatus; expertise?: { has: string } } = {
      status: MentorStatus.APPROVED,
    };

    if (expertise) {
      whereClause.expertise = { has: expertise };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: whereClause,
      orderBy: [
        { average_rating: 'desc' },
        { total_students: 'desc' },
        { total_courses: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        expertise: true,
        experience: true,
        total_students: true,
        total_courses: true,
        average_rating: true,
        user: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
    });

    // Get published course count for each mentor
    const mentorIds = mentors.map(m => m.id);
    
    const publishedCourseCounts = await Promise.all(
      mentorIds.map(async (mentorId) => ({
        mentorId,
        count: await prisma.course.count({
          where: {
            mentor_id: mentorId,
            status: CourseStatus.PUBLISHED,
          },
        }),
      }))
    );

    const countMap = new Map(publishedCourseCounts.map(c => [c.mentorId, c.count]));

    const result = mentors.map(mentor => ({
      ...mentor,
      published_courses: countMap.get(mentor.id) || 0,
    }));

    return NextResponse.json({
      mentors: result,
      personalized: authUser !== null,
    });
  } catch (error) {
    console.error('Get recommended mentors error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
