// Video Types
import { VideoStatus, VideoQuality } from '@prisma/client';

// Video data
export interface VideoData {
  id: string;
  original_name: string;
  filename: string;
  path: string;
  size: number;
  mime_type: string;
  duration: number;
  thumbnail: string | null;
  status: VideoStatus;
  processing_error: string | null;
  created_at: Date;
  updated_at: Date;
}

// Video with qualities
export interface VideoWithQualities extends VideoData {
  qualities: VideoQualityData[];
}

// Video quality data
export interface VideoQualityData {
  id: string;
  video_id: string;
  quality: VideoQuality;
  path: string;
  size: number;
  bitrate: string;
  resolution: string;
  created_at: Date;
}

// Video upload result
export interface VideoUploadResult {
  success: boolean;
  video_id?: string;
  filename?: string;
  path?: string;
  error?: string;
}

// Video processing status
export interface VideoProcessingStatus {
  video_id: string;
  status: VideoStatus;
  progress: number;
  current_quality?: VideoQuality;
  error?: string;
}

// Video stream options
export interface VideoStreamOptions {
  quality?: VideoQuality;
  start?: number;
  end?: number;
}

// Video playback info
export interface VideoPlaybackInfo {
  id: string;
  url: string;
  duration: number;
  thumbnail: string | null;
  available_qualities: VideoQuality[];
  current_quality: VideoQuality;
}

// Watch progress
export interface WatchProgress {
  video_id: string;
  material_id: string;
  position: number;
  duration: number;
  completed: boolean;
  last_watched_at: Date;
}

// Watch progress update
export interface WatchProgressUpdate {
  position: number;
  duration: number;
}

// Video metadata
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
}

// Video quality config
export interface VideoQualityConfig {
  quality: VideoQuality;
  width: number;
  height: number;
  bitrate: string;
  label: string;
}

// Video thumbnail
export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
  position: number; // seconds into the video
}

// Video list item
export interface VideoListItem {
  id: string;
  original_name: string;
  duration: number;
  thumbnail: string | null;
  status: VideoStatus;
  created_at: Date;
}

// Video statistics
export interface VideoStatistics {
  total_videos: number;
  total_size: number; // bytes
  total_duration: number; // seconds
  by_status: Record<VideoStatus, number>;
  processing_queue: number;
}
