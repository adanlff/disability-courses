"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X, Copy, Check, MessageCircle, Send, Share2, Globe, Facebook, Twitter } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ShareCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

export function ShareCourseModal({
  open,
  onOpenChange,
  course,
}: ShareCourseModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Set share URL when component mounts or course changes
  useEffect(() => {
    if (typeof window !== "undefined" && course) {
      const url = `${window.location.origin}/courses/${course.slug || course.id}`;
      setShareUrl(url);
    }
  }, [course]);

  // Handle copy link
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback method for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share to social media functions
  const shareToTwitter = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(
      course ? `Lihat kursus "${course.title}" di platform kami!` : "Lihat kursus ini!"
    );
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(
      course
        ? `Lihat kursus "${course.title}" di platform kami! ${shareUrl}`
        : `Lihat kursus ini: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTelegram = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(
      course ? `Lihat kursus "${course.title}" di platform kami!` : "Lihat kursus ini!"
    );
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <Card
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bagikan Kursus
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bagikan kursus ini ke teman-teman Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Konten utama - compact height with scroll */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-5">
            {/* Link Sharing Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                  <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Link Kursus
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        copied
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Salin
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Options Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                  <Share2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Bagikan ke Media Sosial
                </h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <Card 
                  className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 cursor-pointer transition-colors"
                  onClick={shareToWhatsApp}
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full mb-1.5">
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">WhatsApp</span>
                  </CardContent>
                </Card>

                {/* Telegram */}
                <Card 
                  className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
                  onClick={shareToTelegram}
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full mb-1.5">
                      <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">Telegram</span>
                  </CardContent>
                </Card>

                {/* Twitter/X */}
                <Card 
                  className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer transition-colors"
                  onClick={shareToTwitter}
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full mb-1.5">
                      <Twitter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">Twitter/X</span>
                  </CardContent>
                </Card>

                {/* Facebook */}
                <Card 
                  className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
                  onClick={shareToFacebook}
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-full mb-1.5">
                      <Facebook className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">Facebook</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Informasi kursus */}
            {course && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Detail Kursus
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Anda akan membagikan kursus:{" "}
                      <strong className="text-blue-600 dark:text-blue-400">{course.title}</strong>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Link kursus ini dapat dibagikan ke siapa saja
          </p>
        </div>
      </Card>
    </div>
  );
}