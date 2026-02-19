"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { X, Trash2, Send, Archive, AlertCircle, Loader2, CheckCircle2, BookOpen } from "lucide-react";

type ModalType = "delete" | "submit" | "archive" | "custom";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  is_free: boolean;
  status: string;
  is_published: boolean;
  level: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  _count?: {
    enrollments: number;
    reviews: number;
    sections: number;
  };
  average_rating?: number;
  rejected_reason?: string | null;
}

interface CoursesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: () => void;
  type?: ModalType;
  course?: Course | null;
  
  // Customizable text
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  
  // Style customization
  confirmButtonColor?: string;
  confirmButtonHoverColor?: string;
}

export function CoursesModal({
  open,
  onOpenChange,
  loading,
  onConfirm,
  type = "delete",
  course,
  
  // Custom text
  title,
  description,
  cancelText = "Batal",
  confirmText,
  
  // Style
  confirmButtonColor,
  confirmButtonHoverColor,
}: CoursesModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !open) return null;

  // Determine content based on type
  const getModalContent = () => {
    switch (type) {
      case "delete":
        return {
          title: title || "Hapus Kursus?",
          description: description || 
            "Tindakan ini tidak dapat dibatalkan. Kursus beserta semua data terkait akan dihapus secara permanen.",
          confirmText: confirmText || "Hapus",
          icon: <Trash2 className="w-3.5 h-3.5" />,
          iconBg: "bg-red-50 dark:bg-red-900/20",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border-red-100 dark:border-red-800",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
        
      case "submit":
        return {
          title: title || "Kirim untuk Review?",
          description: description || (course ? (
            <div className="space-y-2">
              <p>
                Kursus <strong className="text-blue-600 dark:text-blue-400">"{course.title}"</strong> akan dikirim ke admin untuk ditinjau.
                Setelah disetujui, kursus akan dipublikasikan dan dapat diakses oleh siswa.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-md border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1.5">Pastikan:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                  <li>Deskripsi kursus sudah lengkap</li>
                  <li>Semua section dan materi sudah ditambahkan</li>
                  <li>Video sudah selesai diproses</li>
                  <li>Harga sudah sesuai</li>
                </ul>
              </div>
            </div>
          ) : "Apakah Anda yakin ingin mengirim kursus ini untuk review?"),
          confirmText: confirmText || "Kirim untuk Review",
          icon: <Send className="w-3.5 h-3.5" />,
          iconBg: "bg-blue-50 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400",
          borderColor: "border-blue-100 dark:border-blue-800",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        };
        
      case "archive":
        return {
          title: title || "Arsipkan Kursus?",
          description: description || 
            "Kursus akan diarsipkan dan tidak akan muncul di daftar kursus publik. Anda dapat mengaktifkannya kembali kapan saja.",
          confirmText: confirmText || "Arsipkan",
          icon: <Archive className="w-3.5 h-3.5" />,
          iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          borderColor: "border-yellow-100 dark:border-yellow-800",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        };
        
      default: // custom
        return {
          title: title || "Konfirmasi",
          description: description || "Apakah Anda yakin ingin melanjutkan?",
          confirmText: confirmText || "Konfirmasi",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          iconBg: "bg-blue-50 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400",
          borderColor: "border-blue-100 dark:border-blue-800",
          buttonColor: confirmButtonColor ? 
            `bg-[${confirmButtonColor}] hover:bg-[${confirmButtonHoverColor || confirmButtonColor}]` : 
            "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const content = getModalContent();

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
      <Card
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className={`px-6 py-4 border-b ${content.iconBg} ${content.borderColor} shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${content.iconBg} ${content.iconColor}`}>
                {content.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {content.title}
              </h2>
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
            {/* Deskripsi Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 ${content.iconBg} rounded-md`}>
                  {React.cloneElement(content.icon, { className: `w-3.5 h-3.5 ${content.iconColor}` })}
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {type === "delete" ? "Peringatan Penting" : 
                   type === "submit" ? "Detail Pengiriman" : 
                   type === "archive" ? "Informasi Arsip" : "Konfirmasi"}
                </h3>
              </div>
              
              <Card className={`rounded-lg border ${content.borderColor} ${content.iconBg}`}>
                <CardContent className="p-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    {typeof content.description === 'string' ? (
                      <p>{content.description}</p>
                    ) : (
                      content.description
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informasi kursus jika tersedia - more compact */}
            {course && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Detail Kursus
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                      {course.thumbnail ? (
                        <div className="flex-shrink-0">
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {course.category?.name || "Tidak berkategori"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {course.level}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {course._count?.sections || 0} Section
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${content.buttonColor}`}
                style={
                  type === "custom" && confirmButtonColor 
                    ? { backgroundColor: confirmButtonColor } 
                    : undefined
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  content.confirmText
                )}
              </button>

              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {type === "delete" 
              ? "Tindakan ini tidak dapat dibatalkan" 
              : "Tinjau kembali sebelum melanjutkan"
            }
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}