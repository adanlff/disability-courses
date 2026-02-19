"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";
import { QuizSettingsModal } from "@/components/modal/quiz-settings-modal";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Settings,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface QuizOption {
  id?: string;
  label: string;
  text: string;
  is_correct: boolean;
  order: number;
}

interface QuizQuestion {
  id?: string;
  question: string;
  order: number;
  points: number;
  options: QuizOption[];
}

interface Quiz {
  id?: string;
  material_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit: number | null;
  max_attempts: number;
  questions: QuizQuestion[];
}

interface Material {
  id: string;
  title: string;
  type: string;
  section: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

export default function QuizBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.materialId as string;
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [isNewQuiz, setIsNewQuiz] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });

  const [quiz, setQuiz] = useState<Quiz>({
    material_id: materialId,
    title: "",
    description: "",
    passing_score: 70,
    time_limit: null,
    max_attempts: 3,
    questions: [],
  });

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  }, []);

  // Fungsi untuk menampilkan SweetAlert
  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  // Fetch material and quiz data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch material info
        const materialRes = await fetch(`/api/materials/${materialId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!materialRes.ok) {
          throw new Error("Gagal mengambil data materi");
        }

        const materialData = await materialRes.json();
        setMaterial(materialData);

        // Try to fetch existing quiz
        const quizRes = await fetch(`/api/materials/${materialId}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setQuiz(quizData);
          setIsNewQuiz(false);
        } else {
          // No quiz exists, use default
          setQuiz((prev) => ({
            ...prev,
            title: materialData.title || "Quiz",
          }));
          setIsNewQuiz(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        showSweetAlert(
          "error",
          "Gagal",
          "Gagal mengambil data quiz. Silakan coba lagi."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [materialId, router, getAuthToken]);

  // Add new question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      order: quiz.questions.length,
      points: 1,
      options: [
        { label: "A", text: "", is_correct: true, order: 0 },
        { label: "B", text: "", is_correct: false, order: 1 },
        { label: "C", text: "", is_correct: false, order: 2 },
        { label: "D", text: "", is_correct: false, order: 3 },
      ],
    };

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  // Remove question
  const removeQuestion = (index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })),
    }));
  };

  // Update question text
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  // Update option text
  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optionIndex ? { ...o, text } : o)),
            }
          : q
      ),
    }));
  };

  // Set correct answer
  const setCorrectAnswer = (questionIndex: number, optionLabel: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              options: q.options.map((o) => ({ ...o, is_correct: o.label === optionLabel })),
            }
          : q
      ),
    }));
  };

  // Handle quiz settings save
  const handleSettingsSave = (settings: {
    passing_score: number;
    time_limit: number | null;
    max_attempts: number;
  }) => {
    setQuiz((prev) => ({
      ...prev,
      ...settings,
    }));
    setSettingsOpen(false);
  };

  // Save quiz
  const handleSave = async () => {
    // Validation
    if (!quiz.title.trim()) {
      showSweetAlert("error", "Validasi Gagal", "Judul quiz harus diisi");
      return;
    }

    if (quiz.questions.length === 0) {
      showSweetAlert("error", "Validasi Gagal", "Minimal harus ada 1 pertanyaan");
      return;
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question.trim()) {
        showSweetAlert("error", "Validasi Gagal", `Pertanyaan ${i + 1} belum diisi`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        showSweetAlert("error", "Validasi Gagal", `Pertanyaan ${i + 1} belum memiliki jawaban benar`);
        return;
      }
      const emptyOptions = q.options.filter((o) => !o.text.trim());
      if (emptyOptions.length > 0) {
        showSweetAlert("error", "Validasi Gagal", `Semua opsi jawaban pertanyaan ${i + 1} harus diisi`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const method = isNewQuiz ? "POST" : "PUT";
      const response = await fetch(`/api/materials/${materialId}/quiz`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quiz),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan quiz");
      }

      const savedQuiz = await response.json();
      setQuiz(savedQuiz);
      setIsNewQuiz(false);

      showSweetAlert("success", "Berhasil", "Quiz berhasil disimpan");
    } catch (err) {
      console.error("Error saving quiz:", err);
      showSweetAlert(
        "error",
        "Gagal",
        err instanceof Error ? err.message : "Gagal menyimpan quiz"
      );
    } finally {
      setSaving(false);
    }
  };

  // Move question
  const moveQuestion = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= quiz.questions.length) return;

    setQuiz((prev) => {
      const newQuestions = [...prev.questions];
      [newQuestions[fromIndex], newQuestions[toIndex]] = [newQuestions[toIndex], newQuestions[fromIndex]];
      return {
        ...prev,
        questions: newQuestions.map((q, i) => ({ ...q, order: i })),
      };
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR", "ADMIN"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600">Memuat quiz builder...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR", "ADMIN"]}>
      <MentorLayout>
        {/* SweetAlert Component */}
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={alertConfig.type === "success" ? 2000 : 3000}
          showCloseButton={true}
        />

        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/mentor/courses/${courseId}/sections`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <HelpCircle className="h-8 w-8 text-[#005EB8]" />
                  Quiz Builder
                </h1>
              </div>
            </div>
            <div className="flex justify-center md:justify-end flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSettingsOpen(true)}
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="bg-[#005EB8] hover:bg-[#004A93] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Quiz
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quiz Info Card */}
          <Card className="border rounded-xl border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Informasi Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Judul Quiz</Label>
                <Input
                  value={quiz.title}
                  onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul quiz"
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Deskripsi (Opsional)</Label>
                <Textarea
                  value={quiz.description}
                  onChange={(e) => setQuiz((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat tentang quiz ini"
                  rows={2}
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#005EB8]/5 rounded-xl border border-[#005EB8]/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Sparkles className="h-6 w-6 text-[#005EB8] mr-2" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{quiz.questions.length}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pertanyaan</p>
                  </div>
                </div>
                <div className="p-4 bg-[#008A00]/5 rounded-xl border border-[#008A00]/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-[#008A00] mr-2" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{quiz.passing_score}%</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nilai Lulus</p>
                  </div>
                </div>
                <div className="p-4 bg-[#F4B400]/5 rounded-xl border border-[#F4B400]/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Settings className="h-6 w-6 text-[#F4B400] mr-2" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{quiz.max_attempts}x</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Maks Percobaan</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Pertanyaan</h2>
              <Button 
                onClick={addQuestion} 
                className="bg-[#005EB8] hover:bg-[#004A93] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pertanyaan
              </Button>
            </div>

            {quiz.questions.length === 0 ? (
              <Card className="border rounded-xl border-dashed border-gray-300 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Belum ada pertanyaan</p>
                  <Button 
                    onClick={addQuestion} 
                    variant="outline"
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pertanyaan Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quiz.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border rounded-xl border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Question Number and Controls */}
                        <div className="flex flex-row md:flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#005EB8] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {qIndex + 1}
                          </div>
                          <div className="flex md:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => moveQuestion(qIndex, "up")}
                              disabled={qIndex === 0}
                              className="h-8 w-8 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => moveQuestion(qIndex, "down")}
                              disabled={qIndex === quiz.questions.length - 1}
                              className="h-8 w-8 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-900 dark:text-gray-100">Pertanyaan</Label>
                            <Textarea
                              value={question.question}
                              onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                              placeholder="Tulis pertanyaan di sini..."
                              rows={2}
                              className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-3">
                            <Label className="text-gray-900 dark:text-gray-100">Pilihan Jawaban</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {question.options.map((option, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    option.is_correct
                                      ? "border-[#008A00] bg-[#008A00]/5 dark:border-[#008A00] dark:bg-[#008A00]/10"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setCorrectAnswer(qIndex, option.label)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                                      option.is_correct
                                        ? "bg-[#008A00] text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                  <Input
                                    value={option.text}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    placeholder={`Jawaban ${option.label}`}
                                    className="flex-1 border-0 focus:ring-0 bg-transparent dark:bg-transparent dark:text-white"
                                  />
                                  {option.is_correct && (
                                    <CheckCircle className="h-5 w-5 text-[#008A00] flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Points */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-gray-900 dark:text-gray-100">Poin:</Label>
                              <Input
                                type="number"
                                min={1}
                                value={question.points}
                                onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 1)}
                                className="w-20 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="flex md:flex-col justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeQuestion(qIndex)}
                            className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Question Button at bottom */}
            {quiz.questions.length > 0 && (
              <div className="text-center">
                <Button 
                  onClick={addQuestion} 
                  variant="outline"
                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pertanyaan Lain
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Settings Modal */}
        <QuizSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          quiz={quiz}
          onSave={handleSettingsSave}
        />
      </MentorLayout>
    </ProtectedRoute>
  );
}