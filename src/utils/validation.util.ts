// Validation utilities

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Indonesian)
export function isValidPhone(phone: string): boolean {
  // Indonesian phone: 08xxx or +628xxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// UUID validation
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Password strength validation
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf kapital');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung angka');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung karakter khusus');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Password strength score
export function getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 5) return 'good';
  return 'strong';
}

// Username validation
export function isValidUsername(username: string): boolean {
  // 3-30 chars, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

// Slug validation
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

// Indonesian NIK validation (basic)
export function isValidNIK(nik: string): boolean {
  // NIK is 16 digits
  return /^\d{16}$/.test(nik);
}

// Credit card validation (Luhn algorithm)
export function isValidCreditCard(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Future date validation
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getTime() > Date.now();
}

// Past date validation
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getTime() < Date.now();
}

// Number range validation
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Positive number validation
export function isPositive(value: number): boolean {
  return value > 0;
}

// Non-negative validation
export function isNonNegative(value: number): boolean {
  return value >= 0;
}

// Array not empty validation
export function isNotEmpty<T>(arr: T[]): boolean {
  return arr.length > 0;
}

// Object has property validation
export function hasProperty<T extends object>(obj: T, prop: keyof T): boolean {
  return prop in obj && obj[prop] !== undefined;
}
