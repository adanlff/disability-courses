// Crypto utilities
import crypto from 'crypto';

// Hash password (sync version for simplicity, use bcrypt in production)
export function hashSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
export function verifySync(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  if (!salt || !originalHash) return false;
  
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Generate random token
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate secure random string (URL-safe)
export function generateSecureString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

// Generate UUID v4
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Hash string with SHA256
export function hashSHA256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Hash string with MD5 (not secure, for checksums only)
export function hashMD5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

// Encrypt text with AES-256 (simplified version without Buffer issues)
export function encrypt(text: string, secret: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, new Uint8Array(key), new Uint8Array(iv));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt text with AES-256
export function decrypt(encryptedText: string, secret: string): string | null {
  try {
    const algorithm = 'aes-256-cbc';
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) return null;
    
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, new Uint8Array(key), new Uint8Array(iv));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return null;
  }
}

// Generate HMAC signature
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Verify HMAC signature
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(data, secret);
  try {
    return crypto.timingSafeEqual(
      new Uint8Array(Buffer.from(signature)),
      new Uint8Array(Buffer.from(expectedSignature))
    );
  } catch {
    return false;
  }
}

// Generate OTP
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}
