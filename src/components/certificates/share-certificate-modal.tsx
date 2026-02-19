"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, Copy, Linkedin, Facebook, Twitter, Share2, AlertCircle, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ShareCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateNumber: string;
  courseTitle: string;
}

export function ShareCertificateModal({
  open,
  onOpenChange,
  certificateNumber,
  courseTitle,
}: ShareCertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/certificates/verify/${certificateNumber}`);
    }
  }, [certificateNumber]);

  if (!open) return null;

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: string) => {
    const text = `Saya telah menyelesaikan kursus "${courseTitle}" dan mendapatkan sertifikat!`;
    
    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const socialButtons = [
    {
      platform: "linkedin",
      icon: <Linkedin className="w-3 h-3" />,
      label: "LinkedIn",
      bgColor: "bg-[#0A66C2] hover:bg-[#0A66C2]/90",
      iconColor: "text-white",
    },
    {
      platform: "twitter",
      icon: <Twitter className="w-3 h-3" />,
      label: "Twitter",
      bgColor: "bg-[#1DA1F2] hover:bg-[#1DA1F2]/90",
      iconColor: "text-white",
    },
    {
      platform: "facebook",
      icon: <Facebook className="w-3 h-3" />,
      label: "Facebook",
      bgColor: "bg-[#1877F2] hover:bg-[#1877F2]/90",
      iconColor: "text-white",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <Card 
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <Share2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bagikan Sertifikat
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bagikan pencapaian Anda
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
            {/* Info Kursus Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Detail Sertifikat
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-3">
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kursus yang Diselesaikan</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{courseTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nomor Sertifikat</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{certificateNumber}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol Media Sosial Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Bagikan ke Media Sosial
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5">
                {socialButtons.map((button) => (
                  <Card 
                    key={button.platform}
                    onClick={() => handleShare(button.platform)}
                    className={`rounded-lg cursor-pointer transition-all ${button.bgColor}`}
                  >
                    <CardContent className="p-3 flex flex-col items-center justify-center">
                      <div className={`${button.iconColor} mb-1`}>
                        {button.icon}
                      </div>
                      <span className="text-[11px] font-medium text-white">{button.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Salin Link Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Salin Link Verifikasi
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-3">
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-mono text-gray-900 dark:text-gray-300 truncate">
                        {shareUrl}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      {copied ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  
                  {copied && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <p className="text-[11px] text-green-600">Link berhasil disalin ke clipboard!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Verifikasi Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Informasi Verifikasi
                </h3>
              </div>
              
              <Card className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-0.5">Validasi Sertifikat</p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Link ini dapat digunakan oleh siapa saja untuk memverifikasi keaslian sertifikat Anda.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
              >
                Tutup
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Sertifikat valid dan dapat diverifikasi kapan saja
          </p>
        </div>
      </Card>
    </div>
  );
}