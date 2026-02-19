// Storage utilities
import { storageConfig } from '@/config/storage.config';
import { mkdir, unlink, stat, readdir } from 'fs/promises';
import path from 'path';

type FileCategory = 'image' | 'video' | 'document' | 'certificate';

// Get upload path for file type
export function getUploadPath(category: FileCategory, subPath?: string): string {
  let basePath = '';
  
  switch (category) {
    case 'image':
      basePath = subPath ? storageConfig.paths.images[subPath as keyof typeof storageConfig.paths.images] || 'images' : 'images';
      break;
    case 'video':
      basePath = storageConfig.paths.videos;
      break;
    case 'document':
      basePath = storageConfig.paths.documents;
      break;
    case 'certificate':
      basePath = storageConfig.paths.certificates;
      break;
    default:
      basePath = storageConfig.paths.temp;
  }
  
  return path.join(storageConfig.uploadDir, basePath);
}

// Get public URL for file
export function getPublicUrl(relativePath: string): string {
  if (storageConfig.cdn.enabled && storageConfig.cdn.baseUrl) {
    return `${storageConfig.cdn.baseUrl}/${relativePath}`;
  }
  return `/uploads/${relativePath}`;
}

// Validate file type
export function validateFileType(mimeType: string, category: FileCategory): boolean {
  if (category === 'certificate') return mimeType === 'application/pdf';
  const allowedTypes = storageConfig.allowedTypes[category as keyof typeof storageConfig.allowedTypes];
  return allowedTypes?.includes(mimeType) ?? false;
}

// Validate file size
export function validateFileSize(size: number, category: FileCategory): boolean {
  const limit = storageConfig.limits[category as keyof typeof storageConfig.limits];
  return limit ? size <= limit : true;
}

// Generate unique filename
export function generateFilename(originalName: string, prefix?: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefixStr = prefix ? `${prefix}_` : '';
  return `${prefixStr}${timestamp}_${random}${ext}`;
}

// Ensure directory exists
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

// Delete file
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

// Get file stats
export async function getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const stats = await stat(filePath);
    return { size: stats.size, mtime: stats.mtime };
  } catch {
    return null;
  }
}

// List files in directory
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    return await readdir(dirPath);
  } catch {
    return [];
  }
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Clean old temp files (older than 24 hours)
export async function cleanTempFiles(): Promise<number> {
  const tempDir = path.join(storageConfig.uploadDir, storageConfig.paths.temp);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let deletedCount = 0;
  
  try {
    const files = await readdir(tempDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await getFileStats(filePath);
      
      if (stats && (now - stats.mtime.getTime()) > maxAge) {
        if (await deleteFile(filePath)) {
          deletedCount++;
        }
      }
    }
  } catch (error) {
    console.error('Clean temp files error:', error);
  }
  
  return deletedCount;
}
