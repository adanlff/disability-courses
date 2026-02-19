// Auth Middleware
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export type AuthMiddlewareResult = {
  authenticated: boolean;
  userId?: string;
  role?: UserRole;
  error?: NextResponse;
};

// Check if request is authenticated
export function requireAuth(request: NextRequest): AuthMiddlewareResult {
  const authUser = getAuthUser(request);
  
  if (!authUser) {
    return {
      authenticated: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  
  return {
    authenticated: true,
    userId: authUser.userId,
    role: authUser.role,
  };
}

// Check if user has required role
export function requireRole(request: NextRequest, roles: UserRole[]): AuthMiddlewareResult {
  const authResult = requireAuth(request);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  const authUser = getAuthUser(request);
  if (!authUser || !hasRole(authUser, roles)) {
    return {
      authenticated: true,
      userId: authUser?.userId,
      role: authUser?.role,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  
  return {
    authenticated: true,
    userId: authUser.userId,
    role: authUser.role,
  };
}

// Require admin role
export function requireAdmin(request: NextRequest): AuthMiddlewareResult {
  return requireRole(request, [UserRole.ADMIN]);
}

// Require mentor role
export function requireMentor(request: NextRequest): AuthMiddlewareResult {
  return requireRole(request, [UserRole.MENTOR, UserRole.ADMIN]);
}

// Require student role (or any authenticated user)
export function requireStudent(request: NextRequest): AuthMiddlewareResult {
  return requireAuth(request);
}

// Optional auth - doesn't fail if not authenticated
export function optionalAuth(request: NextRequest): AuthMiddlewareResult {
  const authUser = getAuthUser(request);
  
  return {
    authenticated: !!authUser,
    userId: authUser?.userId,
    role: authUser?.role,
  };
}
