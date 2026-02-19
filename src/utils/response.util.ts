// Response utilities
import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants';

// Success response
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json(data, { status });
}

// Created response
export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: HTTP_STATUS.CREATED });
}

// No content response
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// Error response
export function errorResponse(message: string, status: number = HTTP_STATUS.BAD_REQUEST): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Validation error response
export function validationErrorResponse(
  message: string,
  details?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    { error: message, details },
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}

// Not found response
export function notFoundResponse(message: string = 'Resource tidak ditemukan'): NextResponse {
  return NextResponse.json({ error: message }, { status: HTTP_STATUS.NOT_FOUND });
}

// Unauthorized response
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: HTTP_STATUS.UNAUTHORIZED });
}

// Forbidden response
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: HTTP_STATUS.FORBIDDEN });
}

// Conflict response
export function conflictResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: HTTP_STATUS.CONFLICT });
}

// Server error response
export function serverErrorResponse(message: string = 'Terjadi kesalahan server'): NextResponse {
  return NextResponse.json({ error: message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
}

// Paginated response
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

// List response
export function listResponse<T>(items: T[], total?: number): NextResponse {
  return NextResponse.json({
    items,
    total: total ?? items.length,
  });
}

// Message response
export function messageResponse(message: string, data?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ message, ...data });
}

// Redirect response
export function redirectResponse(url: string, permanent: boolean = false): NextResponse {
  const status = permanent ? 308 : 307;
  return NextResponse.redirect(url, status);
}

// JSON with custom headers
export function jsonWithHeaders<T>(
  data: T,
  headers: Record<string, string>,
  status: number = HTTP_STATUS.OK
): NextResponse {
  return NextResponse.json(data, { status, headers });
}

// Stream response
export function streamResponse(
  stream: ReadableStream,
  contentType: string = 'application/octet-stream'
): NextResponse {
  return new NextResponse(stream, {
    headers: { 'Content-Type': contentType },
  });
}
