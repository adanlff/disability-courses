// WithParams Middleware - Helper for dynamic route params
import { NextRequest, NextResponse } from 'next/server';

// Generic route params type
export interface RouteParams<T extends Record<string, string> = Record<string, string>> {
  params: T;
}

// Common param types (using index signature for compatibility)
export type IdParams = { id: string; [key: string]: string };
export type SlugParams = { slug: string; [key: string]: string };
export type KeyParams = { key: string; [key: string]: string };
export type CourseIdParams = { courseId: string; [key: string]: string };
export type EnrollmentIdParams = { enrollmentId: string; [key: string]: string };

// Validate UUID format
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Validate params and return error if invalid
export function validateIdParam(id: string): NextResponse | null {
  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: 'ID tidak valid' },
      { status: 400 }
    );
  }
  return null;
}

// Higher-order function to wrap handlers with param validation
export function withIdValidation(
  handler: (request: NextRequest, params: IdParams) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: RouteParams<IdParams>
  ): Promise<NextResponse> => {
    const error = validateIdParam(params.id);
    if (error) return error;
    
    return handler(request, params);
  };
}

// Extract path segment from URL
export function getPathSegment(request: NextRequest, position: number): string | null {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  return segments[position] || null;
}

// Get all path segments
export function getPathSegments(request: NextRequest): string[] {
  return new URL(request.url).pathname.split('/').filter(Boolean);
}

// Create handler with validated params
export function createHandler<T extends Record<string, string>>(
  handler: (request: NextRequest, params: T) => Promise<NextResponse>,
  validators?: Partial<Record<keyof T, (value: string) => boolean>>
) {
  return async (
    request: NextRequest,
    { params }: RouteParams<T>
  ): Promise<NextResponse> => {
    // Validate each param if validators provided
    if (validators) {
      const entries = Object.entries(validators);
      for (const [key, validatorFn] of entries) {
        const value = params[key as keyof T];
        if (validatorFn && value && !validatorFn(value)) {
          return NextResponse.json(
            { error: `${key} tidak valid` },
            { status: 400 }
          );
        }
      }
    }
    
    return handler(request, params);
  };
}
