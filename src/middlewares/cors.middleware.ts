// CORS Middleware
import { NextRequest, NextResponse } from 'next/server';

interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CorsOptions = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Get CORS headers
export function getCorsHeaders(request: NextRequest, options: CorsOptions = {}): Headers {
  const opts = { ...defaultOptions, ...options };
  const origin = request.headers.get('origin') || '';
  const headers = new Headers();
  
  // Check if origin is allowed
  const isAllowed = opts.allowedOrigins?.includes('*') || 
    opts.allowedOrigins?.includes(origin);
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', opts.allowedOrigins?.includes('*') ? '*' : origin);
  }
  
  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (opts.allowedMethods) {
    headers.set('Access-Control-Allow-Methods', opts.allowedMethods.join(', '));
  }
  
  if (opts.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  }
  
  if (opts.exposedHeaders) {
    headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }
  
  if (opts.maxAge) {
    headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }
  
  return headers;
}

// Handle OPTIONS preflight request
export function handlePreflight(request: NextRequest, options?: CorsOptions): NextResponse {
  const headers = getCorsHeaders(request, options);
  return new NextResponse(null, { status: 204, headers });
}

// Add CORS headers to response
export function withCors(
  response: NextResponse,
  request: NextRequest,
  options?: CorsOptions
): NextResponse {
  const corsHeaders = getCorsHeaders(request, options);
  
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// CORS middleware wrapper
export function corsMiddleware(options?: CorsOptions) {
  return (request: NextRequest): NextResponse | null => {
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, options);
    }
    return null;
  };
}
