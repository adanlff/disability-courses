// File utilities
import { stat, readdir, unlink, mkdir, copyFile, rename } from 'fs/promises';
import path from 'path';
import { storageConfig } from '@/config/storage.config';

// Get file extension
export function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

// Get filename without extension
export function getBasename(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

// Generate unique filename
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const ext = getExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefixStr = prefix ? `${prefix}_` : '';
  return `${prefixStr}${timestamp}_${random}.${ext}`;
}

// Check if file exists
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await stat(filepath);
    return true;
  } catch {
    return false;
  }
}

// Get file size
export async function getFileSize(filepath: string): Promise<number> {
  const stats = await stat(filepath);
  return stats.size;
}

// Format file size
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

// Get MIME type from extension
export function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Others
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
  };
  
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Validate file type
export function isAllowedFileType(mimeType: string, category: 'image' | 'video' | 'document'): boolean {
  const allowedTypes = storageConfig.allowedTypes[category];
  return allowedTypes?.includes(mimeType) ?? false;
}

// Validate file size
export function isAllowedFileSize(size: number, category: 'image' | 'video' | 'document'): boolean {
  const maxSize = storageConfig.limits[category];
  return size <= maxSize;
}

// Create directory if not exists
export async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

// List files in directory
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    return await readdir(dirPath);
  } catch {
    return [];
  }
}

// Delete file
export async function deleteFile(filepath: string): Promise<boolean> {
  try {
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

// Copy file
export async function copyFileTo(source: string, destination: string): Promise<boolean> {
  try {
    await copyFile(source, destination);
    return true;
  } catch {
    return false;
  }
}

// Move file
export async function moveFile(source: string, destination: string): Promise<boolean> {
  try {
    await rename(source, destination);
    return true;
  } catch {
    return false;
  }
}

// Get relative path from absolute
export function getRelativePath(absolutePath: string, basePath: string = process.cwd()): string {
  return path.relative(basePath, absolutePath).replace(/\\/g, '/');
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
