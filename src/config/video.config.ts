// Video Configuration
export const videoConfig = {
  // Video quality settings
  qualities: {
    Q360P: { width: 640, height: 360, bitrate: '800k', label: '360p' },
    Q480P: { width: 854, height: 480, bitrate: '1200k', label: '480p' },
    Q720P: { width: 1280, height: 720, bitrate: '2500k', label: '720p (HD)' },
    Q1080P: { width: 1920, height: 1080, bitrate: '5000k', label: '1080p (Full HD)' },
  },
  
  // Default quality for processing
  defaultQuality: 'Q720P',
  
  // Encoding settings
  encoding: {
    codec: 'libx264',
    audioCodec: 'aac',
    audioBitrate: '128k',
    preset: 'medium', // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
    crf: 23, // Constant Rate Factor (0-51, lower = better quality)
  },
  
  // Thumbnail settings
  thumbnail: {
    count: 3, // Number of thumbnails to generate
    width: 320,
    height: 180,
    format: 'jpg',
  },
  
  // Streaming settings
  streaming: {
    chunkSize: 1024 * 1024, // 1MB chunks
    enableHLS: process.env.ENABLE_HLS === 'true',
    hlsSegmentDuration: 10, // seconds
  },
  
  // Processing
  processing: {
    maxConcurrent: parseInt(process.env.MAX_VIDEO_PROCESSING || '2'),
    timeout: 30 * 60 * 1000, // 30 minutes
  },
  
  // Supported formats
  supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  outputFormat: 'mp4',
};

export type VideoConfig = typeof videoConfig;
export default videoConfig;
