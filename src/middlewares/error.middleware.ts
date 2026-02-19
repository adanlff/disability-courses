// Error Middleware
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/lib/constants';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

// Custom API Error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Error
export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]>) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Not Found Error
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} tidak ditemukan`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

// Unauthorized Error
export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

// Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}

// Conflict Error
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

// Handle Zod validation errors
function handleZodError(error: ZodError): NextResponse {
  const fieldErrors = error.flatten().fieldErrors;
  const details: Record<string, string[]> = {};
  
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    details[field] = errors as string[];
  });
  
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      code: 'VALIDATION_ERROR',
      details,
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}

// Handle Prisma errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case 'P2002':
      return NextResponse.json(
        { error: 'Data sudah ada', code: 'DUPLICATE_ENTRY' },
        { status: HTTP_STATUS.CONFLICT }
      );
    case 'P2025':
      return NextResponse.json(
        { error: 'Data tidak ditemukan', code: 'NOT_FOUND' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    case 'P2003':
      return NextResponse.json(
        { error: 'Referensi data tidak valid', code: 'INVALID_REFERENCE' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    default:
      return NextResponse.json(
        { error: ERROR_MESSAGES.SERVER_ERROR, code: 'DATABASE_ERROR' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
  }
}

// Handle App errors
function handleAppError(error: AppError): NextResponse {
  const response: ApiError = {
    code: error.code,
    message: error.message,
  };
  
  if (error instanceof ValidationError) {
    response.details = error.details;
  }
  
  return NextResponse.json(response, { status: error.statusCode });
}

// Main error handler
export function handleError(error: unknown): NextResponse {
  console.error('Error:', error);
  
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }
  
  if (error instanceof AppError) {
    return handleAppError(error);
  }
  
  // Unknown error
  const message = process.env.NODE_ENV === 'development' 
    ? (error as Error).message 
    : ERROR_MESSAGES.SERVER_ERROR;
  
  return NextResponse.json(
    {
      error: message,
      code: 'INTERNAL_ERROR',
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

// Wrap handler with error handling
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
