// Cookie utilities
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Cookie options
export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Default cookie options
const defaultOptions: CookieOptions = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_ID: 'session_id',
  THEME: 'theme',
  LOCALE: 'locale',
} as const;

// Set cookie in response
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (opts.maxAge) cookieString += `; Max-Age=${opts.maxAge}`;
  if (opts.expires) cookieString += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.path) cookieString += `; Path=${opts.path}`;
  if (opts.domain) cookieString += `; Domain=${opts.domain}`;
  if (opts.secure) cookieString += '; Secure';
  if (opts.httpOnly) cookieString += '; HttpOnly';
  if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
  
  response.headers.append('Set-Cookie', cookieString);
}

// Delete cookie from response
export function deleteCookie(response: NextResponse, name: string): void {
  setCookie(response, name, '', {
    maxAge: 0,
    expires: new Date(0),
  });
}

// Get cookie from request
export function getCookie(request: NextRequest, name: string): string | null {
  return request.cookies.get(name)?.value ?? null;
}

// Get all cookies from request
export function getAllCookies(request: NextRequest): Record<string, string> {
  const result: Record<string, string> = {};
  request.cookies.getAll().forEach(cookie => {
    result[cookie.name] = cookie.value;
  });
  return result;
}

// Set auth tokens in cookies
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  setCookie(response, COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    maxAge: 15 * 60, // 15 minutes
  });
  
  setCookie(response, COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse): void {
  deleteCookie(response, COOKIE_NAMES.ACCESS_TOKEN);
  deleteCookie(response, COOKIE_NAMES.REFRESH_TOKEN);
}

// Parse cookie string
export function parseCookieString(cookieString: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  cookieString.split(';').forEach(part => {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      result[key] = decodeURIComponent(value);
    }
  });
  
  return result;
}
