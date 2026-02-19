// Role Middleware
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, hasRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Check if user has any of the specified roles
export function requireRoles(request: NextRequest, allowedRoles: UserRole[]): NextResponse | null {
  const authUser = getAuthUser(request);
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!hasRole(authUser, allowedRoles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return null; // Allow proceed
}

// Role check factory
export function createRoleMiddleware(allowedRoles: UserRole[]) {
  return (request: NextRequest): NextResponse | null => {
    return requireRoles(request, allowedRoles);
  };
}

// Pre-built role middlewares
export const adminOnly = createRoleMiddleware([UserRole.ADMIN]);
export const mentorOnly = createRoleMiddleware([UserRole.MENTOR]);
export const mentorOrAdmin = createRoleMiddleware([UserRole.MENTOR, UserRole.ADMIN]);
export const studentOnly = createRoleMiddleware([UserRole.STUDENT]);
export const anyAuth = createRoleMiddleware([UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT]);

// Get role label (Indonesian)
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.MENTOR]: 'Mentor',
    [UserRole.STUDENT]: 'Siswa',
  };
  return labels[role];
}

// Check if user is admin
export function isAdmin(request: NextRequest): boolean {
  const authUser = getAuthUser(request);
  return authUser?.role === UserRole.ADMIN;
}

// Check if user is mentor
export function isMentor(request: NextRequest): boolean {
  const authUser = getAuthUser(request);
  return authUser?.role === UserRole.MENTOR || authUser?.role === UserRole.ADMIN;
}

// Check if user is student
export function isStudent(request: NextRequest): boolean {
  const authUser = getAuthUser(request);
  return authUser?.role === UserRole.STUDENT;
}

// Check if user owns the resource
export function isOwner(request: NextRequest, resourceUserId: string): boolean {
  const authUser = getAuthUser(request);
  if (!authUser) return false;
  return authUser.userId === resourceUserId;
}

// Check if user is owner or admin
export function isOwnerOrAdmin(request: NextRequest, resourceUserId: string): boolean {
  const authUser = getAuthUser(request);
  if (!authUser) return false;
  return authUser.userId === resourceUserId || authUser.role === UserRole.ADMIN;
}
