// Video processing utilities
import { videoConfig } from '@/config/video.config';
import { VideoQuality, VideoStatus } from '@prisma/client';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
}

interface ProcessingResult {
  success: boolean;
  qualities?: VideoQuality[];
  thumbnail?: string;
  duration?: number;
  error?: string;
}

// Get video quality settings
export function getQualitySettings(quality: VideoQuality) {
  return videoConfig.qualities[quality];
}

// Get all available qualities
export function getAvailableQualities(): { value: VideoQuality; label: string }[] {
  return Object.entries(videoConfig.qualities).map(([key, config]) => ({
    value: key as VideoQuality,
    label: config.label,
  }));
}

// Determine qualities to generate based on source resolution
export function determineTargetQualities(sourceWidth: number, sourceHeight: number): VideoQuality[] {
  const qualities: VideoQuality[] = [];
  
  if (sourceHeight >= 360) qualities.push(VideoQuality.Q360P);
  if (sourceHeight >= 480) qualities.push(VideoQuality.Q480P);
  if (sourceHeight >= 720) qualities.push(VideoQuality.Q720P);
  if (sourceHeight >= 1080) qualities.push(VideoQuality.Q1080P);
  
  return qualities.length > 0 ? qualities : [VideoQuality.Q360P];
}

// Build FFmpeg command for transcoding (stub - would use actual FFmpeg)
export function buildTranscodeCommand(
  inputPath: string,
  outputPath: string,
  quality: VideoQuality
): string {
  const settings = getQualitySettings(quality);
  const { codec, preset, crf, audioCodec, audioBitrate } = videoConfig.encoding;
  
  return `ffmpeg -i "${inputPath}" -c:v ${codec} -preset ${preset} -crf ${crf} ` +
    `-vf scale=${settings.width}:${settings.height} -b:v ${settings.bitrate} ` +
    `-c:a ${audioCodec} -b:a ${audioBitrate} "${outputPath}"`;
}

// Build thumbnail generation command
export function buildThumbnailCommand(
  inputPath: string,
  outputPath: string,
  position: number
): string {
  const { width, height } = videoConfig.thumbnail;
  return `ffmpeg -i "${inputPath}" -ss ${position} -vframes 1 -vf scale=${width}:${height} "${outputPath}"`;
}

// Process video (stub - would integrate with actual processing)
export async function processVideo(videoPath: string): Promise<ProcessingResult> {
  try {
    // In development, just simulate processing
    console.log('🎬 Processing video:', videoPath);
    
    // TODO: Implement actual video processing with FFmpeg
    // 1. Extract metadata
    // 2. Generate thumbnails
    // 3. Transcode to multiple qualities
    // 4. Generate HLS segments if enabled
    
    return {
      success: true,
      qualities: [VideoQuality.Q720P],
      duration: 0,
    };
  } catch (error) {
    console.error('Video processing error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Get video metadata (stub)
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata | null> {
  try {
    // TODO: Use FFprobe to extract metadata
    console.log('📊 Getting metadata for:', videoPath);
    
    return {
      duration: 0,
      width: 1920,
      height: 1080,
      codec: 'h264',
      bitrate: 5000000,
      fps: 30,
    };
  } catch (error) {
    console.error('Get metadata error:', error);
    return null;
  }
}

// Calculate processing progress
export function calculateProgress(
  currentStep: number,
  totalSteps: number
): number {
  return Math.round((currentStep / totalSteps) * 100);
}

// Estimate processing time based on duration
export function estimateProcessingTime(
  durationSeconds: number,
  qualities: VideoQuality[]
): number {
  // Rough estimate: 0.5x real-time per quality
  return durationSeconds * qualities.length * 0.5;
}

// Get status label (Indonesian)
export function getStatusLabel(status: VideoStatus): string {
  const labels: Record<VideoStatus, string> = {
    [VideoStatus.UPLOADING]: 'Mengupload',
    [VideoStatus.PROCESSING]: 'Memproses',
    [VideoStatus.COMPLETED]: 'Selesai',
    [VideoStatus.FAILED]: 'Gagal',
  };
  return labels[status];
}

// Check if video format is supported
export function isSupportedFormat(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? videoConfig.supportedFormats.includes(ext) : false;
}
