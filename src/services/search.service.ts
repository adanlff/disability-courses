// Search Service
import prisma from '@/lib/prisma';
import { CourseStatus, MentorStatus } from '@prisma/client';

export interface SearchFilters {
  category?: string;
  level?: string;
  isFree?: boolean;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search courses
export async function searchCourses(
  query: string,
  filters: SearchFilters = {},
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 12 } = options;
  const { category, level, isFree, priceMin, priceMax, ratingMin, sortBy, sortOrder } = filters;

  const where: Record<string, unknown> = {
    status: CourseStatus.PUBLISHED,
  };

  // Search query
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { has: query.toLowerCase() } },
    ];
  }

  // Filters
  if (category) where.category_id = category;
  if (level) where.level = level;
  if (isFree !== undefined) where.is_free = isFree;
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) (where.price as Record<string, number>).gte = priceMin;
    if (priceMax !== undefined) (where.price as Record<string, number>).lte = priceMax;
  }
  if (ratingMin !== undefined) where.average_rating = { gte: ratingMin };

  // Sort
  let orderBy: Record<string, string> = { created_at: 'desc' };
  if (sortBy) {
    orderBy = { [sortBy]: sortOrder || 'desc' };
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        short_description: true,
        price: true,
        discount_price: true,
        is_free: true,
        level: true,
        average_rating: true,
        total_students: true,
        total_reviews: true,
        mentor: { select: { user: { select: { full_name: true, avatar_url: true } } } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Search mentors
export async function searchMentors(
  query: string,
  options: { page?: number; limit?: number; expertise?: string } = {}
) {
  const { page = 1, limit = 12, expertise } = options;

  const where: Record<string, unknown> = {
    status: MentorStatus.APPROVED,
  };

  if (query) {
    where.OR = [
      { user: { full_name: { contains: query, mode: 'insensitive' } } },
      { expertise: { has: query } },
      { experience: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (expertise) {
    where.expertise = { has: expertise };
  }

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      select: {
        id: true,
        expertise: true,
        total_students: true,
        total_courses: true,
        average_rating: true,
        user: { select: { id: true, full_name: true, avatar_url: true, bio: true } },
      },
      orderBy: { average_rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  return { mentors, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get search suggestions
export async function getSearchSuggestions(query: string, limit: number = 5) {
  if (!query || query.length < 2) return [];

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true, slug: true },
      take: limit,
    }),
    prisma.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);

  return {
    courses: courses.map(c => ({ type: 'course', title: c.title, slug: c.slug })),
    categories: categories.map(c => ({ type: 'category', title: c.name, slug: c.slug })),
  };
}

// Get popular searches
export async function getPopularSearches(limit: number = 10) {
  // Get from activity logs
  const searches = await prisma.activityLog.findMany({
    where: { action: 'search' },
    select: { metadata: true },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  const searchCounts: Record<string, number> = {};
  searches.forEach(s => {
    const query = (s.metadata as { query?: string })?.query?.toLowerCase();
    if (query) {
      searchCounts[query] = (searchCounts[query] || 0) + 1;
    }
  });

  return Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

// Get filter options
export async function getFilterOptions() {
  const [categories, levels] = await Promise.all([
    prisma.category.findMany({
      where: { is_active: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { level: true },
      distinct: ['level'],
    }),
  ]);

  return {
    categories,
    levels: levels.map(l => l.level),
    priceRanges: [
      { label: 'Gratis', min: 0, max: 0 },
      { label: '< Rp50.000', min: 1, max: 50000 },
      { label: 'Rp50.000 - Rp100.000', min: 50000, max: 100000 },
      { label: 'Rp100.000 - Rp200.000', min: 100000, max: 200000 },
      { label: '> Rp200.000', min: 200000, max: undefined },
    ],
    ratings: [4, 3, 2, 1],
  };
}
