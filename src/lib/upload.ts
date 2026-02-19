// File upload utilities
import { storageConfig } from '@/config/storage.config';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { generateFilename, validateFileType, validateFileSize, getUploadPath } from './storage';

type UploadCategory = 'image' | 'video' | 'document';

interface UploadResult {
  success: boolean;
  filename?: string;
  path?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

interface UploadOptions {
  category: UploadCategory;
  subPath?: string;
  prefix?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

// Process file upload from FormData
export async function processFileUpload(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const { category, subPath, prefix } = options;
    
    // Validate file type
    const allowedTypes = options.allowedTypes || storageConfig.allowedTypes[category];
    if (!allowedTypes?.includes(file.type)) {
      return {
        success: false,
        error: `Format file tidak didukung. Gunakan: ${allowedTypes?.join(', ')}`,
      };
    }
    
    // Validate file size
    const maxSize = options.maxSize || storageConfig.limits[category];
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return {
        success: false,
        error: `Ukuran file maksimal ${maxSizeMB}MB`,
      };
    }
    
    // Get upload directory
    const uploadDir = getUploadPath(category, subPath);
    await mkdir(uploadDir, { recursive: true });
    
    // Generate filename
    const filename = generateFilename(file.name, prefix);
    const filepath = path.join(uploadDir, filename);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);
    await writeFile(filepath, uint8Array);
    
    // Generate relative path for URL
    const relativePath = path.relative(storageConfig.uploadDir, filepath).replace(/\\/g, '/');
    const url = `/uploads/${relativePath}`;
    
    return {
      success: true,
      filename,
      path: filepath,
      url,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Gagal mengupload file',
    };
  }
}

// Upload profile picture
export async function uploadProfilePicture(file: File, userId: string): Promise<UploadResult> {
  return processFileUpload(file, {
    category: 'image',
    subPath: 'profiles',
    prefix: `profile_${userId}`,
    maxSize: 5 * 1024 * 1024, // 5MB
  });
}

// Upload course thumbnail
export async function uploadCourseThumbnail(file: File, courseId: string): Promise<UploadResult> {
  return processFileUpload(file, {
    category: 'image',
    subPath: 'courses',
    prefix: `thumbnail_${courseId}`,
    maxSize: 10 * 1024 * 1024, // 10MB
  });
}

// Upload course video
export async function uploadCourseVideo(file: File, materialId: string): Promise<UploadResult> {
  return processFileUpload(file, {
    category: 'video',
    prefix: `video_${materialId}`,
    maxSize: 500 * 1024 * 1024, // 500MB
  });
}

// Upload course document
export async function uploadCourseDocument(file: File, materialId: string): Promise<UploadResult> {
  return processFileUpload(file, {
    category: 'document',
    prefix: `doc_${materialId}`,
    maxSize: 50 * 1024 * 1024, // 50MB
  });
}

// Get file extension
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

// Check if file is image
export function isImageFile(mimeType: string): boolean {
  return storageConfig.allowedTypes.image.includes(mimeType);
}

// Check if file is video
export function isVideoFile(mimeType: string): boolean {
  return storageConfig.allowedTypes.video.includes(mimeType);
}

// Check if file is document
export function isDocumentFile(mimeType: string): boolean {
  return storageConfig.allowedTypes.document.includes(mimeType);
}
