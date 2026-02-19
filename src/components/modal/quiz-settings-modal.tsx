"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { X, Settings, Sparkles, CheckCircle, Repeat, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface Quiz {
  id?: string;
  material_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit: number | null;
  max_attempts: number;
  questions: Array<{
    id?: string;
    question: string;
    order: number;
    points: number;
    options: Array<{
      id?: string;
      label: string;
      text: string;
      is_correct: boolean;
      order: number;
    }>;
  }>;
}

interface QuizSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: Quiz;
  onSave: (settings: {
    passing_score: number;
    time_limit: number | null;
    max_attempts: number;
  }) => void;
  loading?: boolean;
}

export function QuizSettingsModal({
  open,
  onOpenChange,
  quiz,
  onSave,
  loading = false,
}: QuizSettingsModalProps) {
  const [settings, setSettings] = useState({
    passing_score: quiz.passing_score,
    time_limit: quiz.time_limit,
    max_attempts: quiz.max_attempts,
  });

  const [errors, setErrors] = useState<{
    passing_score?: string;
    time_limit?: string;
    max_attempts?: string;
  }>({});

  if (!open) return null;

  // Validasi input
  const validateInputs = () => {
    const newErrors: typeof errors = {};

    if (settings.passing_score < 0 || settings.passing_score > 100) {
      newErrors.passing_score = "Nilai lulus harus antara 0-100%";
    }

    if (settings.time_limit !== null && settings.time_limit < 1) {
      newErrors.time_limit = "Batas waktu minimal 1 menit";
    }

    if (settings.max_attempts < 1) {
      newErrors.max_attempts = "Minimal 1 percobaan";
    }

    if (settings.max_attempts > 10) {
      newErrors.max_attempts = "Maksimal 10 percobaan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validateInputs()) {
      onSave(settings);
    }
  };

  // Reset to default values
  const handleReset = () => {
    setSettings({
      passing_score: 70,
      time_limit: null,
      max_attempts: 3,
    });
    setErrors({});
  };

  // Calculate total points
  const totalPoints = quiz.questions.reduce(
    (sum, question) => sum + question.points,
    0
  );

  // Calculate passing points
  const passingPoints = Math.ceil(
    (settings.passing_score / 100) * totalPoints
  );

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
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pengaturan Quiz
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Atur parameter dan batasan quiz
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
            {/* Statistik Quiz Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Statistik Quiz
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Card className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-md">
                        <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {quiz.questions.length} Pertanyaan
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total pertanyaan dalam quiz
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-green-100 dark:bg-green-800 rounded-md">
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {totalPoints} Poin Total
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Jumlah maksimal poin
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded-md">
                        <Repeat className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {passingPoints} Poin Lulus
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Minimal poin untuk lulus
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pengaturan Quiz Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Pengaturan Quiz
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 space-y-3">
                  {/* Nilai Minimum Lulus */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        Nilai Minimum Lulus
                      </label>
                      <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-[11px] font-medium rounded-md">
                        {settings.passing_score}%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.passing_score}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            passing_score: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-8 ${
                          errors.passing_score ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">%</span>
                      </div>
                    </div>
                    {errors.passing_score ? (
                      <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.passing_score}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Siswa harus mendapatkan minimal <strong>{settings.passing_score}%</strong> untuk lulus
                      </p>
                    )}
                  </div>

                  {/* Batas Waktu */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        Batas Waktu
                      </label>
                      <span className={`px-1.5 py-0.5 text-[11px] font-medium rounded-md ${
                        settings.time_limit
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}>
                        {settings.time_limit ? `${settings.time_limit} menit` : "Tidak ada"}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={settings.time_limit || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            time_limit: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                        placeholder="Kosongkan untuk tanpa batas waktu"
                        className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-8 ${
                          errors.time_limit ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    {errors.time_limit ? (
                      <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.time_limit}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        {settings.time_limit
                          ? `Quiz akan otomatis dikumpulkan setelah ${settings.time_limit} menit`
                          : "Tidak ada batas waktu untuk menyelesaikan quiz"}
                      </p>
                    )}
                  </div>

                  {/* Maksimal Percobaan */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        Maksimal Percobaan
                      </label>
                      <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-[11px] font-medium rounded-md">
                        {settings.max_attempts}x
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.max_attempts}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          max_attempts: parseInt(e.target.value) || 1,
                        }))
                      }
                      className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.max_attempts ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {errors.max_attempts ? (
                      <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.max_attempts}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Siswa dapat mencoba quiz maksimal <strong>{settings.max_attempts} kali</strong>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Menyimpan...
                  </>
                ) : "Simpan Pengaturan"}
              </button>

              <button
                onClick={handleReset}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Default
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
            Quiz: {quiz.title}
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}