import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter khusus'),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  disability_type: z.enum(['BUTA_WARNA', 'DISLEKSIA', 'KOGNITIF', 'LOW_VISION', 'MENTOR', 'MOTORIK', 'TUNARUNGU', 'STUDENT']).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter khusus'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter khusus'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

// ==================== USER SCHEMAS ====================

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  disability_type: z.enum(['BUTA_WARNA', 'DISLEKSIA', 'KOGNITIF', 'LOW_VISION', 'MENTOR', 'MOTORIK', 'TUNARUNGU']).optional().nullable(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'MENTOR', 'STUDENT']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

// ==================== COURSE SCHEMAS ====================

export const createCourseSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  short_description: z.string().optional(),
  thumbnail: z.string().optional().nullable(),
  category_id: z.string().uuid('Category ID tidak valid'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).default('ALL_LEVELS'),
  language: z.string().default('id'),
  price: z.number().min(0, 'Harga tidak boleh negatif').default(0),
  discount_price: z.number().min(0).optional().nullable(),
  is_free: z.boolean().default(false),
  is_premium: z.boolean().default(false),
  requirements: z.array(z.string()).default([]),
  what_you_will_learn: z.array(z.string()).default([]),
  target_audience: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const updateCourseSchema = createCourseSchema.partial();

// ==================== SECTION SCHEMAS ====================

export const createSectionSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter'),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const updateSectionSchema = createSectionSchema.partial();

// ==================== MATERIAL SCHEMAS ====================

export const createMaterialSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter'),
  description: z.string().optional().nullable(),
  type: z.enum(['VIDEO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT']),
  content: z.string().optional().nullable(),
  video_id: z.string().uuid().optional().nullable(),
  document_url: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable().transform((val) => {
    if (!val || val.trim() === '') return null;
    // Validate URL format
    try {
      new URL(val);
      return val;
    } catch {
      return null;
    }
  }),
  duration: z.number().int().min(0).default(0),
  order: z.number().int().min(0).optional(),
  is_free: z.boolean().default(false),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// ==================== MENTOR SCHEMAS ====================

// Helper for optional URL - converts empty string to null before validation
const optionalUrl = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

export const applyMentorSchema = z.object({
  expertise: z.array(z.string()).min(1, 'Minimal 1 keahlian'),
  experience: z.number().int().min(0, 'Pengalaman tidak boleh negatif'),
  education: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  website: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  portfolio: optionalUrl,
});

export const updateMentorProfileSchema = applyMentorSchema.partial();

// ==================== REVIEW SCHEMAS ====================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  is_anonymous: z.boolean().default(false),
});

export const updateReviewSchema = createReviewSchema.partial();

// ==================== COMMENT SCHEMAS ====================

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong'),
  parent_id: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong'),
});

// ==================== CATEGORY SCHEMAS ====================

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ==================== TRANSACTION SCHEMAS ====================

export const createTransactionSchema = z.object({
  course_id: z.string().uuid('Course ID tidak valid'),
  payment_method: z.enum(['E_WALLET', 'VIRTUAL_ACCOUNT', 'QRIS']),
});

// ==================== ENROLLMENT SCHEMAS ====================

export const updateProgressSchema = z.object({
  material_id: z.string().uuid('Material ID tidak valid'),
  is_completed: z.boolean().optional(),
  watched_duration: z.number().int().min(0).optional(),
  last_position: z.number().int().min(0).optional(),
});

// ==================== SEARCH SCHEMAS ====================

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  is_free: z.boolean().optional(),
  rating_min: z.number().min(0).max(5).optional(),
  sort_by: z.enum(['relevance', 'newest', 'popular', 'rating', 'price_low', 'price_high']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ==================== VIDEO SCHEMAS ====================

export const updateVideoSchema = z.object({
  status: z.enum(['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  processing_error: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
});

// ==================== REPORT SCHEMAS ====================

export const reportSchema = z.object({
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
  description: z.string().optional(),
});

// ==================== SYSTEM SETTINGS SCHEMAS ====================

export const updateSettingSchema = z.object({
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  category: z.string().optional(),
  is_public: z.boolean().optional(),
});

// ==================== TYPE EXPORTS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type ApplyMentorInput = z.infer<typeof applyMentorSchema>;
export type UpdateMentorProfileInput = z.infer<typeof updateMentorProfileSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
