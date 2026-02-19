// components/courses/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2 } from "lucide-react";

// Import video.js styles
import "video.js/dist/video-js.css";

interface VideoQuality {
  quality: string;
  url: string;
  label?: string;
}

interface VideoPlayerProps {
  videoId: string;
  qualities?: VideoQuality[];
  defaultQuality?: string;
  defaultUrl?: string;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
  onComplete?: () => void;
  autoSaveInterval?: number; // ms, default 10000
}

export default function VideoPlayer({
  videoId,
  qualities = [],
  defaultQuality,
  defaultUrl,
  initialPosition = 0,
  onProgress,
  onComplete,
  autoSaveInterval = 10000,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuality, setCurrentQuality] = useState(defaultQuality || "Q720P");
  const [currentUrl, setCurrentUrl] = useState(defaultUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSavedPosition = useRef(0);
  const hasCompleted = useRef(false);

  // Quality labels
  const qualityLabels: Record<string, string> = {
    Q360P: "360p",
    Q480P: "480p",
    Q720P: "720p HD",
    Q1080P: "1080p Full HD",
  };

  // Initialize video.js - create video element imperatively
  useEffect(() => {
    if (!containerRef.current || !currentUrl) return;

    let player: any = null;

    const initPlayer = async () => {
      try {
        // Dynamically import video.js to avoid SSR issues
        const videojs = (await import("video.js")).default;

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create video element imperatively
        const videoElement = document.createElement('video');
        videoElement.className = 'video-js vjs-big-play-centered vjs-theme-city';
        videoElement.setAttribute('playsinline', 'true');
        
        // Append to container
        if (containerRef.current) {
          containerRef.current.appendChild(videoElement);
        }

        // Create player
        player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
          preload: "auto",
          sources: [
            {
              src: currentUrl,
              type: "video/mp4",
            },
          ],
        });

        playerRef.current = player;

        // Handle loading state
        player.on("loadeddata", () => {
          setIsLoading(false);
          setIsReady(true);

          // Seek to initial position
          if (initialPosition > 0 && player.duration()) {
            player.currentTime(initialPosition);
          }
        });

        player.on("waiting", () => {
          setIsLoading(true);
        });

        player.on("playing", () => {
          setIsLoading(false);
        });

        player.on("error", () => {
          setError("Gagal memuat video. Silakan coba lagi.");
          setIsLoading(false);
        });

        // Handle time update for progress saving
        player.on("timeupdate", () => {
          const currentTime = player.currentTime();
          const duration = player.duration();

          if (currentTime && duration) {
            // Check for completion (95% watched)
            if (!hasCompleted.current && currentTime / duration >= 0.95) {
              hasCompleted.current = true;
              if (onComplete) {
                onComplete();
              }
            }
          }
        });

        // Handle video ended
        player.on("ended", () => {
          if (!hasCompleted.current) {
            hasCompleted.current = true;
            if (onComplete) {
              onComplete();
            }
          }
        });
      } catch (err) {
        console.error("Error initializing video player:", err);
        setError("Gagal menginisialisasi player video.");
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (player) {
        try {
          player.dispose();
        } catch (e) {
          console.error("Error disposing player:", e);
        }
      }
      playerRef.current = null;
      // Clear container on cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [videoId, currentUrl, initialPosition, onComplete]);

  // Auto-save progress
  useEffect(() => {
    const saveProgress = () => {
      if (!playerRef.current || !isReady) return;

      try {
        const currentTime = playerRef.current.currentTime();
        const duration = playerRef.current.duration();

        if (currentTime && duration && currentTime !== lastSavedPosition.current) {
          lastSavedPosition.current = currentTime;
          if (onProgress) {
            onProgress(currentTime, duration);
          }
        }
      } catch (e) {
        // Player might be disposed
      }
    };

    const interval = setInterval(saveProgress, autoSaveInterval);

    // Also save on visibility change (when user leaves tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Save one last time on unmount
      saveProgress();
    };
  }, [autoSaveInterval, onProgress, isReady]);

  // Handle quality change
  const handleQualityChange = useCallback(
    (quality: string) => {
      const qualityOption = qualities.find((q) => q.quality === quality);
      if (!qualityOption || !playerRef.current) return;

      try {
        // Save current position
        const currentTime = playerRef.current.currentTime() || 0;
        const wasPlaying = !playerRef.current.paused();

        setCurrentQuality(quality);
        setCurrentUrl(qualityOption.url);
        setIsLoading(true);

        // Player will reload with new source, we need to restore position
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.currentTime(currentTime);
            if (wasPlaying) {
              playerRef.current.play();
            }
          }
        }, 100);
      } catch (e) {
        console.error("Error changing quality:", e);
      }
    },
    [qualities]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current || !isReady) return;

      // Don't handle if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      try {
        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault();
            if (playerRef.current.paused()) {
              playerRef.current.play();
            } else {
              playerRef.current.pause();
            }
            break;
          case "ArrowLeft":
            e.preventDefault();
            playerRef.current.currentTime(
              Math.max(0, playerRef.current.currentTime() - 10)
            );
            break;
          case "ArrowRight":
            e.preventDefault();
            playerRef.current.currentTime(
              Math.min(
                playerRef.current.duration(),
                playerRef.current.currentTime() + 10
              )
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            playerRef.current.volume(
              Math.min(1, playerRef.current.volume() + 0.1)
            );
            break;
          case "ArrowDown":
            e.preventDefault();
            playerRef.current.volume(
              Math.max(0, playerRef.current.volume() - 0.1)
            );
            break;
          case "m":
            e.preventDefault();
            playerRef.current.muted(!playerRef.current.muted());
            break;
          case "f":
            e.preventDefault();
            if (playerRef.current.isFullscreen()) {
              playerRef.current.exitFullscreen();
            } else {
              playerRef.current.requestFullscreen();
            }
            break;
          case "j":
            e.preventDefault();
            playerRef.current.currentTime(
              Math.max(0, playerRef.current.currentTime() - 10)
            );
            break;
          case "l":
            e.preventDefault();
            playerRef.current.currentTime(
              Math.min(
                playerRef.current.duration(),
                playerRef.current.currentTime() + 10
              )
            );
            break;
        }
      } catch (e) {
        // Player might be in invalid state
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReady]);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Force re-init by changing URL temporarily
                const url = currentUrl;
                setCurrentUrl("");
                setTimeout(() => setCurrentUrl(url), 100);
              }}
              className="bg-[#005EB8] hover:bg-[#004A93]"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      )}

      {/* Video container - video.js will manage this */}
      <div 
        ref={containerRef} 
        className="w-full"
        style={{ minHeight: '200px' }}
      />

      {/* Quality selector */}
      {qualities.length > 1 && isReady && (
        <div className="absolute top-4 right-4 z-20">
          <Select value={currentQuality} onValueChange={handleQualityChange}>
            <SelectTrigger className="w-[140px] bg-black/70 border-gray-600 text-white">
              <Settings className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {qualities.map((q) => (
                <SelectItem key={q.quality} value={q.quality}>
                  {qualityLabels[q.quality] || q.quality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 z-20 opacity-0 hover:opacity-100 transition-opacity">
        <div className="bg-black/70 text-white text-xs p-2 rounded">
          <p>Space/K: Play/Pause | J/L: ±10s | F: Fullscreen | M: Mute</p>
        </div>
      </div>
    </div>
  );
}
