// Video processor utilities
import { videoConfig } from '@/config/video.config';
import { VideoQuality, VideoStatus } from '@prisma/client';

// Video processing job
export interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
  outputDir: string;
  qualities: VideoQuality[];
  generateThumbnails: boolean;
}

// Processing result
export interface ProcessingResult {
  success: boolean;
  videoId: string;
  processedQualities: VideoQuality[];
  thumbnails: string[];
  duration: number;
  error?: string;
}

// Build FFmpeg command for transcoding
export function buildFFmpegCommand(
  inputPath: string,
  outputPath: string,
  quality: VideoQuality
): string {
  const settings = videoConfig.qualities[quality];
  const { codec, preset, crf, audioCodec, audioBitrate } = videoConfig.encoding;
  
  return [
    'ffmpeg',
    `-i "${inputPath}"`,
    `-c:v ${codec}`,
    `-preset ${preset}`,
    `-crf ${crf}`,
    `-vf scale=${settings.width}:${settings.height}`,
    `-b:v ${settings.bitrate}`,
    `-c:a ${audioCodec}`,
    `-b:a ${audioBitrate}`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(' ');
}

// Build thumbnail extraction command
export function buildThumbnailCommand(
  inputPath: string,
  outputPath: string,
  position: number = 1
): string {
  const { width, height } = videoConfig.thumbnail;
  
  return [
    'ffmpeg',
    `-i "${inputPath}"`,
    `-ss ${position}`,
    `-vframes 1`,
    `-vf scale=${width}:${height}`,
    `"${outputPath}"`,
  ].join(' ');
}

// Build FFprobe command for metadata
export function buildFFprobeCommand(inputPath: string): string {
  return [
    'ffprobe',
    '-v quiet',
    '-print_format json',
    '-show_format',
    '-show_streams',
    `"${inputPath}"`,
  ].join(' ');
}

// Determine target qualities based on source resolution
export function determineQualities(sourceHeight: number): VideoQuality[] {
  const qualities: VideoQuality[] = [];
  
  if (sourceHeight >= 360) qualities.push(VideoQuality.Q360P);
  if (sourceHeight >= 480) qualities.push(VideoQuality.Q480P);
  if (sourceHeight >= 720) qualities.push(VideoQuality.Q720P);
  if (sourceHeight >= 1080) qualities.push(VideoQuality.Q1080P);
  
  return qualities.length > 0 ? qualities : [VideoQuality.Q360P];
}

// Estimate processing time
export function estimateProcessingTime(
  durationSeconds: number,
  qualitiesCount: number
): number {
  // Rough estimate: 0.5x real-time per quality level
  return Math.ceil(durationSeconds * qualitiesCount * 0.5);
}

// Format processing progress
export function formatProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
}

// Get quality label
export function getQualityLabel(quality: VideoQuality): string {
  return videoConfig.qualities[quality].label;
}

// Get all quality options
export function getQualityOptions(): Array<{ value: VideoQuality; label: string }> {
  return Object.entries(videoConfig.qualities).map(([key, config]) => ({
    value: key as VideoQuality,
    label: config.label,
  }));
}

// Get status label (Indonesian)
export function getVideoStatusLabel(status: VideoStatus): string {
  const labels: Record<VideoStatus, string> = {
    [VideoStatus.UPLOADING]: 'Mengunggah',
    [VideoStatus.PROCESSING]: 'Memproses',
    [VideoStatus.COMPLETED]: 'Selesai',
    [VideoStatus.FAILED]: 'Gagal',
  };
  return labels[status];
}

// Get status color
export function getVideoStatusColor(status: VideoStatus): string {
  const colors: Record<VideoStatus, string> = {
    [VideoStatus.UPLOADING]: 'blue',
    [VideoStatus.PROCESSING]: 'yellow',
    [VideoStatus.COMPLETED]: 'green',
    [VideoStatus.FAILED]: 'red',
  };
  return colors[status];
}

// Check if video format is supported
export function isSupportedFormat(extension: string): boolean {
  return videoConfig.supportedFormats.includes(extension.toLowerCase());
}

// Format video duration
export function formatVideoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Parse FFprobe output (mock implementation)
export function parseVideoMetadata(ffprobeOutput: string): {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
} | null {
  try {
    const data = JSON.parse(ffprobeOutput);
    const videoStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
    
    if (!videoStream) return null;
    
    return {
      duration: parseFloat(data.format?.duration || '0'),
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      bitrate: parseInt(data.format?.bit_rate || '0', 10),
    };
  } catch {
    return null;
  }
}
