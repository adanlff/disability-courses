// General utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==================== STYLING UTILITIES ====================

/**
 * Combine class names safely for Tailwind CSS
 * Menggabungkan class names dengan aman untuk Tailwind CSS
 * @example cn('p-4', 'bg-red-500', condition && 'hover:bg-red-600')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ==================== STRING UTILITIES ====================

/**
 * Generate URL-friendly slug from string
 * Membuat slug yang ramah URL dari string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate random string
 * Membuat string acak
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate certificate number
 * Membuat nomor sertifikat
 */
export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

/**
 * Truncate text with ellipsis
 * Memotong teks dengan ellipsis
 */
export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length - suffix.length) + suffix;
}

/**
 * Capitalize first letter
 * Kapitalisasi huruf pertama
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Title case
 * Judul dengan kapitalisasi setiap kata
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Get initials from name
 * Mengambil inisial dari nama
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '??';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// ==================== NUMBER & CURRENCY UTILITIES ====================

/**
 * Format number with thousand separator (Indonesian)
 * Format angka dengan separator ribuan (Indonesia)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format percentage
 * Format persentase
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Check if URL is valid
 * Memeriksa apakah URL valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if email is valid
 * Memeriksa apakah email valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password is strong
 * Memeriksa kekuatan password
 */
export function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}

// ==================== OBJECT & ARRAY UTILITIES ====================

/**
 * Parse JSON safely with fallback
 * Parse JSON dengan aman dan fallback
 */
export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone object
 * Clone objek secara mendalam
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 * Memeriksa apakah objek kosong
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Pick properties from object
 * Memilih properti dari objek
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omit properties from object
 * Menghilangkan properti dari objek
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

// ==================== TIME & DELAY UTILITIES ====================

/**
 * Sleep/delay function
 * Fungsi penundaan/tidur
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date to Indonesian format
 * Format tanggal ke format Indonesia
 */
export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date time to Indonesian format
 * Format tanggal dan waktu ke format Indonesia
 */
export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 * Mendapatkan waktu relatif (misal, "2 jam yang lalu")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay === 1) return 'kemarin';
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  return formatDateID(target);
}

// ==================== FUNCTION UTILITIES ====================

/**
 * Retry function with exponential backoff
 * Retry fungsi dengan exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
}

/**
 * Debounce function
 * Fungsi debounce
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 * Fungsi throttle
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== FILE & MEDIA UTILITIES ====================

/**
 * Get file extension from filename
 * Mendapatkan ekstensi file dari nama file
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Format file size to human readable format
 * Format ukuran file ke format yang mudah dibaca
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Validate file type
 * Validasi tipe file
 */
export function isValidFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * Validasi ukuran file
 */
export function isValidFileSize(
  file: File,
  maxSizeBytes: number
): boolean {
  return file.size <= maxSizeBytes;
}

// ==================== UI SPECIFIC UTILITIES ====================

/**
 * Get responsive breakpoint classes
 * Mendapatkan kelas breakpoint responsif
 */
export function responsiveClasses(
  sm: string = '',
  md: string = '',
  lg: string = '',
  xl: string = ''
): string {
  return cn(
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`
  );
}

/**
 * Create container classes
 * Membuat kelas container
 */
export function containerClasses(padding: 'sm' | 'md' | 'lg' = 'md'): string {
  const paddingMap = {
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };
  
  return cn(
    'mx-auto max-w-7xl w-full',
    paddingMap[padding]
  );
}

/**
 * Create grid classes
 * Membuat kelas grid
 */
export function gridClasses(
  cols: 1 | 2 | 3 | 4 = 1,
  gap: 'sm' | 'md' | 'lg' = 'md'
): string {
  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  const gapMap = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };
  
  return cn('grid', colMap[cols], gapMap[gap]);
}

// ==================== COLOR UTILITIES ====================

/**
 * Generate random hex color
 * Membuat warna hex acak
 */
export function randomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Lighten/darken hex color
 * Menerangkan/menggelapkan warna hex
 */
export function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
}

// ==================== LAYOUT FIX UTILITIES ====================

/**
 * Prevent layout shift utility
 * Utility untuk mencegah pergeseran layout
 */
export function preventLayoutShift(): string {
  return 'will-change-transform';
}

/**
 * Smooth transition utility
 * Utility transisi halus
 */
export function smoothTransition(properties: string[] = ['all']): string {
  return `${properties.join(', ')} 0.3s ease-in-out`;
}

/**
 * Aspect ratio utility
 * Utility aspect ratio
 */
export function aspectRatio(width: number, height: number): string {
  return `aspect-[${width}/${height}]`;
}

// ==================== EXPORT TYPES ====================

export type ResponsiveClasses = {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
};

export type GridConfig = {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
};