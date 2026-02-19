"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Folder, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ========== Types ==========
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    courses: number;
  };
}

export interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string;
  order: number;
  is_active: boolean;
}

// ========== Category Dialog (Create/Edit) ==========
interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  parentCategories: Category[];
  formData: CategoryFormData;
  loading: boolean;
  onFormChange: (field: keyof CategoryFormData, value: any) => void;
  onSave: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  parentCategories,
  formData,
  loading,
  onFormChange,
  onSave,
}: CategoryDialogProps) {
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
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {editingCategory
                    ? "Perbarui informasi kategori"
                    : "Isi informasi untuk kategori baru"}
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

        {/* Konten utama */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-5">
            {/* Form Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Detail Kategori
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 space-y-4">
                  {/* Nama Kategori */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Nama Kategori <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => onFormChange("name", e.target.value)}
                      placeholder="Contoh: Pemrograman Web"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => onFormChange("description", e.target.value)}
                      placeholder="Deskripsi singkat kategori..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>

                  {/* Kategori Induk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Kategori Induk
                    </label>
                    <div className="relative">
                      <select
                        value={formData.parent_id}
                        onChange={(e) => onFormChange("parent_id", e.target.value === 'none' ? '' : e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                      >
                        <option value="none">Tidak ada (Kategori Utama)</option>
                        {parentCategories
                          .filter(c => c.id !== editingCategory?.id)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Urutan dan Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Urutan
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.order}
                        onChange={(e) => onFormChange("order", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={formData.is_active ? 'active' : 'inactive'}
                          onChange={(e) => onFormChange("is_active", e.target.value === 'active')}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Non-aktif</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Tips Penting
                </h3>
              </div>
              
              <Card className="rounded-lg border border-yellow-100 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                      {editingCategory 
                        ? "Perubahan pada kategori induk dapat mempengaruhi struktur kategori anak."
                        : "Kategori tanpa induk akan muncul di level utama. Anda dapat membuat subkategori dengan memilih kategori induk."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onSave}
                disabled={!formData.name.trim() || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer */}
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