import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);

    if (user) {
      // Log activity
      await prisma.activityLog.create({
        data: {
          user_id: user.userId,
          action: 'LOGOUT',
          entity_type: 'user',
          entity_id: user.userId,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
        },
      });
    }

    // Note: Since we're using JWT, we can't really invalidate tokens server-side
    // without implementing a token blacklist. The client should remove the token.
    
    return NextResponse.json({
      message: 'Logout berhasil',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
