"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check, Upload, Video, FileText, HelpCircle, ClipboardList, Loader2, AlertCircle } from "lucide-react";

type MaterialType = "VIDEO" | "DOCUMENT" | "QUIZ" | "ASSIGNMENT";

interface MaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    title: string;
    description: string;
    type: MaterialType;
    content: string;
    youtube_url: string;
    duration: number;
    is_free: boolean;
  };
  selectedVideoFile: File | null;
  selectedDocumentFile: File | null;
  isEditing: boolean;
  loading: boolean;
  uploadingVideo: boolean;
  uploadingDocument: boolean;
  uploadProgress: number;
  onFormChange: (field: string, value: any) => void;
  onVideoFileSelect: (file: File | null) => void;
  onDocumentFileSelect: (file: File | null) => void;
  onSave: () => void;
}

export function MaterialModal({
  open,
  onOpenChange,
  formData,
  selectedVideoFile,
  selectedDocumentFile,
  isEditing,
  loading,
  uploadingVideo,
  uploadingDocument,
  uploadProgress,
  onFormChange,
  onVideoFileSelect,
  onDocumentFileSelect,
  onSave,
}: MaterialModalProps) {
  const [durationInMinutes, setDurationInMinutes] = useState(
    Math.floor(formData.duration / 60)
  );

  // Update duration when formData.duration changes
  useEffect(() => {
    setDurationInMinutes(Math.floor(formData.duration / 60));
  }, [formData.duration]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !open) return null;

  // Get material type icon
  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-3.5 h-3.5" />;
      case "DOCUMENT":
        return <FileText className="w-3.5 h-3.5" />;
      case "QUIZ":
        return <HelpCircle className="w-3.5 h-3.5" />;
      case "ASSIGNMENT":
        return <ClipboardList className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  // Get material type color
  const getMaterialColor = (type: MaterialType) => {
    switch (type) {
      case "VIDEO":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800";
      case "DOCUMENT":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800";
      case "QUIZ":
        return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800";
      case "ASSIGNMENT":
        return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800";
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle video file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoFileSelect(file);
      
      // Try to get actual video duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationInSeconds = Math.floor(video.duration);
        onFormChange("duration", durationInSeconds);
        setDurationInMinutes(Math.floor(durationInSeconds / 60));
      };
      video.onerror = () => {
        // Fallback: estimate duration from file size
        const estimatedDuration = Math.floor(file.size / 10000000) * 60;
        onFormChange("duration", estimatedDuration || 60);
        setDurationInMinutes(Math.floor((estimatedDuration || 60) / 60));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  // Handle document file selection
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onDocumentFileSelect(file || null);
  };

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
                  {isEditing ? "Edit Materi" : "Tambah Materi"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditing
                    ? "Perbarui informasi materi"
                    : "Tambahkan materi baru ke section ini"}
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
            {/* Detail Materi Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Detail Materi
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 space-y-4">
                  {/* Judul Materi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Judul Materi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pengenalan HTML"
                      value={formData.title}
                      onChange={(e) => onFormChange("title", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Tipe Materi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Tipe Materi <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["VIDEO", "DOCUMENT", "QUIZ", "ASSIGNMENT"] as MaterialType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const newDuration = type === "VIDEO" ? formData.duration : 0;
                            onFormChange("type", type);
                            onFormChange("duration", newDuration);
                            setDurationInMinutes(Math.floor(newDuration / 60));
                          }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                            formData.type === type
                              ? getMaterialColor(type) + " border-2"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="p-1.5 rounded-full bg-white dark:bg-gray-800 mb-1">
                            {getMaterialIcon(type)}
                          </div>
                          <span className="text-[11px] font-medium">
                            {type === "VIDEO" && "Video"}
                            {type === "DOCUMENT" && "Dokumen"}
                            {type === "QUIZ" && "Kuis"}
                            {type === "ASSIGNMENT" && "Tugas"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      placeholder="Deskripsi materi"
                      value={formData.description}
                      onChange={(e) => onFormChange("description", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section - Conditional based on type */}
            {((formData.type === "VIDEO" && !isEditing) || (formData.type === "DOCUMENT" && !isEditing)) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {formData.type === "VIDEO" ? "Upload Video" : "Upload Dokumen"}
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    {formData.type === "VIDEO" ? (
                      <div className="space-y-3">
                        <div>
                          <Card className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                            <CardContent className="p-4">
                              {selectedVideoFile ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
                                        <Video className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {selectedVideoFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatFileSize(selectedVideoFile.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => onVideoFileSelect(null)}
                                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                    </button>
                                  </div>
                                  {uploadingVideo && (
                                    <div className="space-y-1.5">
                                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-600 transition-all duration-300"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Mengupload... {uploadProgress}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center relative">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                                    Klik atau drag file video ke sini
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    MP4, WebM, MOV (maks. 500MB)
                                  </p>
                                  <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">
                                    Pilih File
                                  </button>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    onChange={handleVideoFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* YouTube URL */}
                        {selectedVideoFile && (
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="px-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                                Atau
                              </span>
                            </div>
                          </div>
                        )}

                        {(!selectedVideoFile || selectedVideoFile) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Gunakan URL YouTube
                            </label>
                            <input
                              type="text"
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={formData.youtube_url}
                              onChange={(e) => onFormChange("youtube_url", e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Masukkan URL YouTube jika tidak ingin upload file video
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Card className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                          <CardContent className="p-4">
                            {selectedDocumentFile ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {selectedDocumentFile.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(selectedDocumentFile.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onDocumentFileSelect(null)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                  </button>
                                </div>
                                {uploadingDocument && (
                                  <div className="flex items-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                      Mengupload dokumen...
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center relative">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                                  Klik atau drag file dokumen ke sini
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  PDF, DOC, DOCX, PPT, PPTX, TXT (maks. 50MB)
                                </p>
                                <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">
                                  Pilih File
                                </button>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                                  onChange={handleDocumentFileChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Konten untuk QUIZ dan ASSIGNMENT */}
            {(formData.type === "QUIZ" || formData.type === "ASSIGNMENT") && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    {formData.type === "QUIZ" ? (
                      <HelpCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <ClipboardList className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {formData.type === "QUIZ" ? "Pertanyaan Kuis" : "Instruksi Tugas"}
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <textarea
                      placeholder={
                        formData.type === "QUIZ"
                          ? "Tuliskan pertanyaan kuis..."
                          : "Tuliskan instruksi tugas..."
                      }
                      value={formData.content}
                      onChange={(e) => onFormChange("content", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Durasi dan Free Preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Pengaturan Tambahan
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Durasi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Durasi (menit)
                        {formData.type === "VIDEO" && (
                          <span className="text-xs text-gray-500 ml-1">(otomatis dari video)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={durationInMinutes}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0;
                            setDurationInMinutes(minutes);
                            onFormChange("duration", minutes * 60);
                          }}
                          disabled={formData.type !== "VIDEO"}
                          className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formData.type !== "VIDEO"
                              ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                        {formData.type !== "VIDEO" && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {formData.type !== "VIDEO" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Durasi tidak berlaku untuk tipe ini
                        </p>
                      )}
                    </div>

                    {/* Free Preview */}
                    <div className="flex items-end">
                      <div className="flex items-center gap-2.5 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 w-full">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id="material-free"
                            checked={formData.is_free}
                            onChange={(e) => onFormChange("is_free", e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <label htmlFor="material-free" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block">
                            Gratis (Preview)
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Materi ini bisa diakses tanpa membeli kursus
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onSave}
                disabled={!formData.title.trim() || loading || uploadingVideo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading || uploadingVideo ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {uploadingVideo ? "Uploading..." : "Menyimpan..."}
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Simpan
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