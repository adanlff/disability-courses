// Application Constants
import { UserRole, UserStatus, CourseStatus, CourseLevel, MentorStatus, EnrollmentStatus, TransactionStatus, PaymentMethod, CertificateStatus, VideoStatus, VideoQuality, MaterialType, DisabilityType } from '@prisma/client';

// Re-export Prisma enums for convenience
export { UserRole, UserStatus, CourseStatus, CourseLevel, MentorStatus, EnrollmentStatus, TransactionStatus, PaymentMethod, CertificateStatus, VideoStatus, VideoQuality, MaterialType, DisabilityType };

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages (Indonesian)
export const ERROR_MESSAGES = {
  // Auth
  UNAUTHORIZED: 'Anda harus login untuk mengakses halaman ini',
  FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses resource ini',
  INVALID_CREDENTIALS: 'Email atau password salah',
  EMAIL_NOT_VERIFIED: 'Email belum terverifikasi',
  ACCOUNT_SUSPENDED: 'Akun Anda telah dinonaktifkan',
  TOKEN_EXPIRED: 'Token telah kedaluwarsa',
  TOKEN_INVALID: 'Token tidak valid',
  
  // User
  USER_NOT_FOUND: 'User tidak ditemukan',
  USER_EXISTS: 'Email sudah terdaftar',
  PASSWORD_MISMATCH: 'Password tidak cocok',
  
  // Course
  COURSE_NOT_FOUND: 'Kursus tidak ditemukan',
  COURSE_NOT_PUBLISHED: 'Kursus tidak tersedia',
  ALREADY_ENROLLED: 'Anda sudah terdaftar di kursus ini',
  NOT_ENROLLED: 'Anda belum terdaftar di kursus ini',
  
  // Mentor
  MENTOR_NOT_FOUND: 'Mentor tidak ditemukan',
  MENTOR_NOT_APPROVED: 'Profil mentor belum disetujui',
  
  // Transaction
  TRANSACTION_NOT_FOUND: 'Transaksi tidak ditemukan',
  TRANSACTION_EXPIRED: 'Transaksi telah kedaluwarsa',
  PENDING_TRANSACTION_EXISTS: 'Anda memiliki transaksi yang belum selesai',
  
  // General
  VALIDATION_ERROR: 'Validasi gagal',
  SERVER_ERROR: 'Terjadi kesalahan server',
  NOT_FOUND: 'Resource tidak ditemukan',
  FILE_TOO_LARGE: 'Ukuran file terlalu besar',
  INVALID_FILE_TYPE: 'Format file tidak didukung',
} as const;

// Success Messages (Indonesian)
export const SUCCESS_MESSAGES = {
  REGISTER: 'Registrasi berhasil',
  LOGIN: 'Login berhasil',
  LOGOUT: 'Logout berhasil',
  EMAIL_VERIFIED: 'Email berhasil diverifikasi',
  PASSWORD_CHANGED: 'Password berhasil diubah',
  PASSWORD_RESET: 'Password berhasil direset',
  PROFILE_UPDATED: 'Profil berhasil diperbarui',
  COURSE_CREATED: 'Kursus berhasil dibuat',
  COURSE_UPDATED: 'Kursus berhasil diperbarui',
  COURSE_DELETED: 'Kursus berhasil dihapus',
  ENROLLED: 'Berhasil mendaftar kursus',
  CERTIFICATE_GENERATED: 'Sertifikat berhasil dibuat',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const FILE_LIMITS = {
  IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Activity log actions
export const ACTIVITY_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  COURSE_PUBLISH: 'COURSE_PUBLISH',
  COURSE_ENROLL: 'COURSE_ENROLL',
  MENTOR_APPLY: 'MENTOR_APPLY',
  MENTOR_APPROVE: 'APPROVE_MENTOR',
  MENTOR_REJECT: 'REJECT_MENTOR',
  REPORT_COMMENT: 'REPORT_COMMENT',
  REPORT_REVIEW: 'REPORT_REVIEW',
} as const;
