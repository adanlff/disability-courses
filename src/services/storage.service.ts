// Storage Service
import { mkdir, writeFile, unlink, stat, readdir, rm } from 'fs/promises';
import path from 'path';
import { storageConfig } from '@/config/storage.config';

// Ensure directory exists
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Save file to storage
export async function saveFile(
  file: Buffer | Uint8Array,
  category: 'profiles' | 'thumbnails' | 'videos' | 'documents' | 'certificates',
  filename: string
): Promise<string> {
  let basePath = '';
  switch (category) {
    case 'profiles':
      basePath = storageConfig.paths.images.profiles;
      break;
    case 'thumbnails':
      basePath = storageConfig.paths.images.thumbnails;
      break;
    case 'videos':
      basePath = storageConfig.paths.videos;
      break;
    case 'documents':
      basePath = storageConfig.paths.documents;
      break;
    case 'certificates':
      basePath = storageConfig.paths.certificates;
      break;
  }

  const fullPath = path.join(process.cwd(), 'uploads', basePath);
  await ensureDirectory(fullPath);

  const filePath = path.join(fullPath, filename);
  await writeFile(filePath, new Uint8Array(file));

  return `/uploads/${basePath}/${filename}`;
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.join(process.cwd(), filePath.replace(/^\//, ''));
    await unlink(absolutePath);
    return true;
  } catch {
    return false;
  }
}

// Get file info
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  createdAt?: Date;
  modifiedAt?: Date;
}> {
  try {
    const absolutePath = path.join(process.cwd(), filePath.replace(/^\//, ''));
    const stats = await stat(absolutePath);
    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// Validate file type
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

// Validate file size
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

// Get files in directory
export async function getDirectoryFiles(dirPath: string): Promise<string[]> {
  try {
    const absolutePath = path.join(process.cwd(), 'uploads', dirPath.replace(/^\//, ''));
    const files = await readdir(absolutePath);
    return files;
  } catch {
    return [];
  }
}

// Clean up temporary files
export async function cleanupTempFiles(): Promise<void> {
  const tempPath = path.join(process.cwd(), 'uploads', storageConfig.paths.temp);
  try {
    await rm(tempPath, { recursive: true, force: true });
    await ensureDirectory(tempPath);
  } catch {
    // Ignore errors
  }
}

// Get storage stats
export async function getStorageStats() {
  const pathsToCheck = [
    { category: 'videos', path: storageConfig.paths.videos },
    { category: 'profiles', path: storageConfig.paths.images.profiles },
    { category: 'thumbnails', path: storageConfig.paths.images.thumbnails },
    { category: 'documents', path: storageConfig.paths.documents },
    { category: 'certificates', path: storageConfig.paths.certificates },
  ];

  const stats = [];
  for (const p of pathsToCheck) {
    const files = await getDirectoryFiles(p.path);
    let totalSize = 0;

    for (const file of files) {
      const info = await getFileInfo(`uploads/${p.path}/${file}`);
      if (info.exists && info.size !== undefined) {
        totalSize += info.size;
      }
    }

    stats.push({
      category: p.category,
      fileCount: files.length,
      totalSize,
    });
  }

  return stats;
}
