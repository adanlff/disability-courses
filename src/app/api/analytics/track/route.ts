import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST /api/analytics/track - Track user analytics event
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    const body = await request.json();
    const { event, properties, page_url, referrer } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event name wajib diisi' }, { status: 400 });
    }

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || null;
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    // Store as activity log
    await prisma.activityLog.create({
      data: {
        user_id: authUser?.userId || 'anonymous',
        action: event,
        entity_type: properties?.entity_type || null,
        entity_id: properties?.entity_id || null,
        metadata: {
          properties: properties || {},
          page_url,
          referrer,
          timestamp: new Date().toISOString(),
        },
        ip_address: ip,
        user_agent: userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    // Don't fail silently for analytics
    return NextResponse.json({ success: false });
  }
}
