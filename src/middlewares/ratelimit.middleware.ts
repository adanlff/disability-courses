// Rate Limiting Middleware
import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/app.config';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Get client identifier
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
  const path = new URL(request.url).pathname;
  return `${ip}:${path}`;
}

// Check rate limit
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = appConfig.rateLimit
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request);
  const now = Date.now();
  
  let entry = rateLimitStore.get(clientId);
  
  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(clientId, entry);
  
  const remaining = Math.max(0, config.max - entry.count);
  const allowed = entry.count <= config.max;
  
  return { allowed, remaining, resetTime: entry.resetTime };
}

// Rate limit response
export function rateLimitResponse(
  resetTime: number,
  message: string = 'Terlalu banyak permintaan, coba lagi nanti'
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

// Rate limit middleware
export function withRateLimit(config?: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const result = checkRateLimit(request, config);
    
    if (!result.allowed) {
      return rateLimitResponse(result.resetTime);
    }
    
    return null;
  };
}

// Strict rate limit for auth endpoints
export const authRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit',
};

// Rate limit for API endpoints
export const apiRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
};

// Rate limit for upload endpoints
export const uploadRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
};

// Clean up expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 1000);
}
