// Analytics Service
import prisma from '@/lib/prisma';

// Track analytics event
export async function trackEvent(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return prisma.activityLog.create({
    data: {
      user_id: userId || 'anonymous',
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata as object,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });
}

// Get analytics events
export async function getEvents(options: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { page = 1, limit = 50, action, userId, entityType, startDate, endDate } = options;
  
  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (userId) where.user_id = userId;
  if (entityType) where.entity_type = entityType;
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) (where.created_at as Record<string, Date>).gte = startDate;
    if (endDate) (where.created_at as Record<string, Date>).lte = endDate;
  }

  const [events, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, full_name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get event summary
export async function getEventSummary(startDate?: Date) {
  const where = startDate ? { created_at: { gte: startDate } } : undefined;
  
  const events = await prisma.activityLog.findMany({
    where,
    select: { action: true },
  });

  const eventCounts: Record<string, number> = {};
  events.forEach(e => {
    eventCounts[e.action] = (eventCounts[e.action] || 0) + 1;
  });

  return Object.entries(eventCounts).map(([action, count]) => ({
    action,
    count,
  })).sort((a, b) => b.count - a.count);
}
