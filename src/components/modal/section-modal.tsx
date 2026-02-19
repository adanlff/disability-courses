"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isEditing: boolean;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
}

export function SectionModal({
  open,
  onOpenChange,
  title,
  description,
  isEditing,
  loading,
  onTitleChange,
  onDescriptionChange,
  onSave,
}: SectionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
      <Card
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Section" : "Tambah Section"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditing
                    ? "Perbarui informasi section"
                    : "Buat section baru untuk kursus ini"}
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
            {/* Section Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Detail Section
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 space-y-4">
                  {/* Judul Section */}
                  <div>
                    <label
                      htmlFor="section-title"
                      className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
                    >
                      Judul Section <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="section-title"
                      type="text"
                      placeholder="Contoh: Pengenalan Dasar"
                      value={title}
                      onChange={(e) => onTitleChange(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label
                      htmlFor="section-description"
                      className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
                    >
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      id="section-description"
                      placeholder="Deskripsi singkat tentang section ini"
                      value={description}
                      onChange={(e) => onDescriptionChange(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onSave}
                disabled={!title.trim() || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {isEditing ? "Simpan Perubahan" : "Tambah Section"}
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
              >
                Batal
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Isi semua field yang diperlukan (*)
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}