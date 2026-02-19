// Validation Middleware
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/lib/constants';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: NextResponse;
}

// Validate request body
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: NextResponse.json(
          {
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: fieldErrors,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      };
    }
    
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Format JSON tidak valid' },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      };
    }
    
    throw error;
  }
}

// Validate query parameters
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | string[]> = {};
    
    searchParams.forEach((value, key) => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });
    
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: NextResponse.json(
          {
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: fieldErrors,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      };
    }
    throw error;
  }
}

// Validate path parameters
export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: NextResponse.json(
          {
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: fieldErrors,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      };
    }
    throw error;
  }
}

// Validate file upload
export function validateFile(
  file: File | null,
  options: {
    required?: boolean;
    maxSize?: number;
    allowedTypes?: string[];
  }
): ValidationResult<File> {
  const { required = true, maxSize, allowedTypes } = options;
  
  if (!file) {
    if (required) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'File wajib diisi' },
          { status: HTTP_STATUS.BAD_REQUEST }
        ),
      };
    }
    return { success: true };
  }
  
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      success: false,
      error: NextResponse.json(
        { error: `Ukuran file maksimal ${maxSizeMB}MB` },
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    };
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Format file tidak didukung. Gunakan: ${allowedTypes.join(', ')}` },
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    };
  }
  
  return { success: true, data: file };
}

// Create validation middleware for body
export function withBodyValidation<T>(schema: ZodSchema<T>) {
  return async (
    request: NextRequest,
    handler: (data: T) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const result = await validateBody(request, schema);
    
    if (!result.success) {
      return result.error!;
    }
    
    return handler(result.data!);
  };
}
