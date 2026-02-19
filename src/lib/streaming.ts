// Video streaming utilities
import { videoConfig } from '@/config/video.config';
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

interface StreamRange {
  start: number;
  end: number;
}

// Parse Range header
export function parseRangeHeader(rangeHeader: string, fileSize: number): StreamRange | null {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;
  
  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  
  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }
  
  return { start, end };
}

// Create video stream response
export async function createVideoStreamResponse(
  videoPath: string,
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const absolutePath = path.join(process.cwd(), videoPath.replace(/^\//, ''));
    const stats = await stat(absolutePath);
    const fileSize = stats.size;
    
    const rangeHeader = request.headers.get('range');
    
    if (rangeHeader) {
      // Partial content (streaming)
      const range = parseRangeHeader(rangeHeader, fileSize);
      
      if (!range) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }
      
      const { start, end } = range;
      const chunkSize = end - start + 1;
      
      // Read the specific range from file
      const fileBuffer = await readFile(absolutePath);
      const chunk = new Uint8Array(fileBuffer.subarray(start, end + 1));
      
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // Full content
      const fileBuffer = await readFile(absolutePath);
      const data = new Uint8Array(fileBuffer);
      
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  } catch (error) {
    console.error('Video stream error:', error);
    return null;
  }
}

// Get optimal quality based on connection
export function getOptimalQuality(connectionSpeed?: string): keyof typeof videoConfig.qualities {
  if (!connectionSpeed) return videoConfig.defaultQuality as keyof typeof videoConfig.qualities;
  
  // Map connection types to quality
  const qualityMap: Record<string, keyof typeof videoConfig.qualities> = {
    '4g': 'Q720P',
    '3g': 'Q480P',
    '2g': 'Q360P',
    'slow-2g': 'Q360P',
    'wifi': 'Q1080P',
  };
  
  return qualityMap[connectionSpeed] || 'Q720P';
}

// Format video duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format duration in words (Indonesian)
export function formatDurationWords(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours} jam ${minutes} menit`;
  } else if (hours > 0) {
    return `${hours} jam`;
  } else if (minutes > 0) {
    return `${minutes} menit`;
  }
  return `${seconds} detik`;
}

// Calculate estimated watch time remaining
export function calculateRemainingTime(totalDuration: number, watchedDuration: number): number {
  return Math.max(0, totalDuration - watchedDuration);
}

// Check if video is completed (90% threshold)
export function isVideoCompleted(watchedDuration: number, totalDuration: number): boolean {
  if (totalDuration <= 0) return false;
  return (watchedDuration / totalDuration) >= 0.9;
}
