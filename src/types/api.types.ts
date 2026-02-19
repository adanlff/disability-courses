// API Types
import { NextRequest, NextResponse } from 'next/server';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// API Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  search?: string;
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

// Route handler types
export type RouteHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: T }
) => Promise<NextResponse>;

export type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

// Query params
export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

// File upload types
export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}
