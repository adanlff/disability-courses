// Main Middleware file
import { NextRequest, NextResponse } from 'next/server';

// Re-export all middlewares
export * from './auth.middleware';
export * from './cors.middleware';
export * from './error.middleware';
export * from './logging.middleware';
export * from './ratelimit.middleware';
export * from './role.middleware';
export * from './validation.middleware';
export * from './withParams';

// Compose multiple middlewares
export function composeMiddlewares(
  ...middlewares: ((request: NextRequest) => NextResponse | null | Promise<NextResponse | null>)[]
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) return result;
    }
    return null;
  };
}

// Chain middleware with handler
export function withMiddleware(
  middlewares: ((request: NextRequest) => NextResponse | null | Promise<NextResponse | null>)[],
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Run middlewares
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) return result;
    }
    
    // Run handler
    return handler(request, ...args);
  };
}

// Create API route with common middleware
export function createApiRoute(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  options?: {
    rateLimit?: boolean;
    logging?: boolean;
    cors?: boolean;
  }
) {
  const middlewares: ((request: NextRequest) => NextResponse | null)[] = [];
  
  // CORS is handled differently - just add headers
  
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Run middlewares
    for (const middleware of middlewares) {
      const result = middleware(request);
      if (result) return result;
    }
    
    // Run handler
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Terjadi kesalahan server' },
        { status: 500 }
      );
    }
  };
}
