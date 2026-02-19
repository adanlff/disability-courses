// Auth Types
import { UserRole, UserStatus } from '@prisma/client';

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Auth User (extracted from token)
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register data
export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  confirm_password?: string;
}

// Token pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Auth response
export interface AuthResponse {
  user: SessionUser;
  tokens: TokenPair;
}

// Session user (safe to expose)
export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Password reset
export interface PasswordReset {
  token: string;
  password: string;
  confirm_password: string;
}

// Password change
export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Email verification
export interface EmailVerification {
  token: string;
}

// Token verification result
export interface TokenVerificationResult {
  valid: boolean;
  expired?: boolean;
  payload?: JwtPayload;
}

// Refresh token request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Permission check
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}
