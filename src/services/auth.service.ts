// Auth Service
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Register new user
export async function register(data: {
  email: string;
  password: string;
  full_name: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      full_name: data.full_name,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
    },
    token,
  };
}

// Login user
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Email atau password salah');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new Error('Akun Anda telah dinonaktifkan');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Email atau password salah');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
    },
    token,
  };
}

// Generate JWT token
export function generateToken(user: { id: string; email: string; role: UserRole }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Change password
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    throw new Error('Password saat ini salah');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

// Reset password request
export async function resetPasswordRequest(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists
    return { success: true };
  }

  const token = jwt.sign({ userId: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      user_id: user.id,
      token,
      type: 'PASSWORD_RESET',
      expires_at: expiresAt,
    },
  });

  // TODO: Send email with reset link
  console.log('Password reset token:', token);

  return { success: true };
}

// Verify email
export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new Error('Token tidak valid');
  }

  if (verificationToken.expires_at < new Date()) {
    throw new Error('Token sudah kadaluarsa');
  }

  if (verificationToken.used_at) {
    throw new Error('Token sudah digunakan');
  }

  await prisma.user.update({
    where: { id: verificationToken.user_id },
    data: { email_verified: true, email_verified_at: new Date() },
  });

  await prisma.verificationToken.update({
    where: { id: verificationToken.id },
    data: { used_at: new Date() },
  });

  return { success: true };
}
