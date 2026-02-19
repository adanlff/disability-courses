// String utilities

// Generate slug from text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Capitalize first letter
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Title case
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

// Truncate text
export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length - suffix.length).trim() + suffix;
}

// Strip HTML tags
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// Escape HTML
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

// Generate random string
export function randomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random ID
export function randomId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

// Get initials from name
export function getInitials(name: string, count: number = 2): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, count)
    .join('');
}

// Mask email
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const maskedLocal = local.charAt(0) + '*'.repeat(Math.min(local.length - 2, 5)) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

// Mask phone
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  const visible = 4;
  return '*'.repeat(phone.length - visible) + phone.slice(-visible);
}

// Format phone number (Indonesian)
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as 08XX-XXXX-XXXX
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  
  return phone;
}

// Normalize phone number to E.164
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  
  // Handle Indonesian format
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  }
  
  return '+' + digits;
}

// Check if string is empty or whitespace
export function isBlank(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

// Remove extra whitespace
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Count words
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Pluralize (Indonesian - simple)
export function pluralize(count: number, singular: string, plural?: string): string {
  // Indonesian doesn't have grammatical plural, but we can add "2 kursus" style
  return `${count} ${singular}`;
}

// Ordinal number (Indonesian)
export function ordinal(n: number): string {
  return `ke-${n}`;
}
