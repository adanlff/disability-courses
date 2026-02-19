import path from 'path';

// Storage Configuration
export const storageConfig = {
  // Base upload directory
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  
  // Storage paths
  paths: {
    images: {
      profiles: 'images/profiles',
      courses: 'images/courses',
      categories: 'images/categories',
      thumbnails: 'images/thumbnails',
    },
    videos: 'videos',
    documents: 'documents',
    certificates: 'certificates',
    temp: 'temp',
  },
  
  // File size limits (in bytes)
  limits: {
    image: 5 * 1024 * 1024, // 5MB
    video: 500 * 1024 * 1024, // 500MB
    document: 50 * 1024 * 1024, // 50MB
    certificate: 10 * 1024 * 1024, // 10MB
  },
  
  // Allowed file types
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // CDN Configuration (optional)
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    baseUrl: process.env.CDN_BASE_URL || '',
  },
  
  // Cloud storage (optional - S3/GCS)
  cloud: {
    provider: process.env.CLOUD_STORAGE_PROVIDER || 'local', // local, s3, gcs
    bucket: process.env.CLOUD_STORAGE_BUCKET || '',
    region: process.env.CLOUD_STORAGE_REGION || '',
  },
};

export type StorageConfig = typeof storageConfig;
export default storageConfig;
