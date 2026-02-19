// Upload Service
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { storageConfig } from '@/config/storage.config';

export interface UploadResult {
  success: boolean;
  filename?: string;
  path?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

// Process file upload
export async function processUpload(
  file: File,
  category: 'image' | 'video' | 'document'
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  // Validate file type
  const allowedTypes = getAllowedTypes(category);
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Tipe file tidak didukung' };
  }

  // Validate file size
  const maxSize = getMaxSize(category);
  if (file.size > maxSize) {
    return { success: false, error: `Ukuran file melebihi batas ${formatBytes(maxSize)}` };
  }

  // Generate filename
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

  // Get upload path
  const uploadPath = getUploadPath(category);
  const fullPath = path.join(process.cwd(), 'uploads', uploadPath);
  
  // Ensure directory exists
  await mkdir(fullPath, { recursive: true });

  // Save file
  const filePath = path.join(fullPath, filename);
  await writeFile(filePath, buffer);

  return {
    success: true,
    filename,
    path: `/uploads/${uploadPath}/${filename}`,
    size: file.size,
    mimeType: file.type,
  };
}

// Upload profile picture
export async function uploadProfilePicture(userId: string, file: File): Promise<UploadResult> {
  const result = await processUpload(file, 'image');
  return result;
}

// Upload course thumbnail
export async function uploadCourseThumbnail(courseId: string, file: File): Promise<UploadResult> {
  const result = await processUpload(file, 'image');
  return result;
}

// Upload video
export async function uploadVideo(file: File): Promise<UploadResult> {
  const result = await processUpload(file, 'video');
  return result;
}

// Upload document
export async function uploadDocument(file: File): Promise<UploadResult> {
  const result = await processUpload(file, 'document');
  return result;
}

// Get allowed types for category
function getAllowedTypes(category: 'image' | 'video' | 'document'): string[] {
  return storageConfig.allowedTypes[category] || [];
}

// Get max size for category
function getMaxSize(category: 'image' | 'video' | 'document'): number {
  return storageConfig.limits[category] || 10 * 1024 * 1024;
}

// Get upload path for category
function getUploadPath(category: 'image' | 'video' | 'document'): string {
  switch (category) {
    case 'image':
      return storageConfig.paths.images.profiles;
    case 'video':
      return storageConfig.paths.videos;
    case 'document':
      return storageConfig.paths.documents;
  }
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate upload
export function validateUpload(file: File, category: 'image' | 'video' | 'document'): { valid: boolean; error?: string } {
  const allowedTypes = getAllowedTypes(category);
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipe file tidak didukung' };
  }

  const maxSize = getMaxSize(category);
  if (file.size > maxSize) {
    return { valid: false, error: `Ukuran file melebihi batas ${formatBytes(maxSize)}` };
  }

  return { valid: true };
}

// Track upload progress (in-memory, use Redis in production)
const uploadProgress = new Map<string, { progress: number; status: string }>();

export function setUploadProgress(uploadId: string, progress: number, status: string) {
  uploadProgress.set(uploadId, { progress, status });
}

export function getUploadProgress(uploadId: string) {
  return uploadProgress.get(uploadId);
}

export function clearUploadProgress(uploadId: string) {
  uploadProgress.delete(uploadId);
}
