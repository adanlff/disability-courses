"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
  Download,
  Video,
  Loader2,
  Lock,
  Play,
  HelpCircle,
  ClipboardList,
  Upload,
  Send,
  AlertCircle,
  RefreshCw,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { useParams } from "next/navigation";
import VideoPlayer from "@/components/courses/video-player";
import CourseReviewForm from "@/components/courses/course-review-form";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "DOCUMENT" | "QUIZ" | "ASSIGNMENT";
  content: string | null;
  video_id: string | null;
  document_url: string | null;
  youtube_url: string | null;
  duration: number;
  order: number;
  is_free: boolean;
  video?: {
    id: string;
    status: string;
    path: string;
    thumbnail: string | null;
  };
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number;
  materials: Material[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  mentor: {
    id: string;
    headline: string | null;
    user: {
      full_name: string;
      avatar_url: string | null;
    };
  };
  sections: Section[];
  total_duration: number;
  total_lectures: number;
}

interface Enrollment {
  id: string;
  progress: number;
  last_accessed_at: string | null;
  progress_records: ProgressRecord[];
}

interface ProgressRecord {
  id: string;
  material_id: string;
  is_completed: boolean;
  watched_duration: number;
  last_position: number;
}

interface VideoQuality {
  quality: string;
  url: string;
}

interface VideoStreamData {
  video_id: string;
  qualities: VideoQuality[];
  default_quality: string;
  default_url: string;
}

interface QuizOption {
  id: string;
  label: string;
  text: string;
  order: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  order: number;
  points: number;
  options: QuizOption[];
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit: number | null;
  max_attempts: number;
  questions: QuizQuestion[];
}

interface QuizAttemptData {
  quiz_id: string;
  max_attempts: number;
  passing_score: number;
  attempts_count: number;
  attempts_remaining: number;
  best_score: number;
  is_passed: boolean;
}

interface QuizResult {
  score: number;
  is_passed: boolean;
  correct_answers: number;
  total_questions: number;
  attempts_remaining: number;
}

export default function CoursePlayer() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [videoData, setVideoData] = useState<VideoStreamData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const [activeTab, setActiveTab] = useState<"materi" | "deskripsi">("materi");

  // Quiz state
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizAttemptData, setQuizAttemptData] = useState<QuizAttemptData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch course and enrollment data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      // Fetch course with sections
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!courseResponse.ok) {
        throw new Error("Gagal mengambil data kursus");
      }

      const courseResult = await courseResponse.json();
      const courseData = courseResult.data || courseResult.course || courseResult;
      setCourse(courseData);

      // Fetch sections if not included
      if (!courseData.sections || courseData.sections.length === 0) {
        const sectionsResponse = await fetch(`/api/courses/${courseId}/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (sectionsResponse.ok) {
          const sectionsResult = await sectionsResponse.json();
          courseData.sections = sectionsResult.sections || [];
          setCourse({ ...courseData });
        }
      }

      // Fetch enrollment and progress
      const enrollmentResponse = await fetch(`/api/users/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (enrollmentResponse.ok) {
        const enrollmentResult = await enrollmentResponse.json();
        const enrollments = enrollmentResult.data?.enrollments || enrollmentResult.enrollments || [];
        console.log("Enrollments fetched:", enrollments);
        
        // Search for enrollment by course_id or course.id
        const courseEnrollment = enrollments.find((e: any) => 
          e.course_id === courseId || e.course?.id === courseId
        );
        
        if (courseEnrollment) {
          console.log("Found enrollment:", courseEnrollment);
          console.log("Progress records:", courseEnrollment.progress_records);
          setEnrollment(courseEnrollment);
        } else {
          console.log("No enrollment found for courseId:", courseId);
        }
      }

      // Set initial material (first one or last accessed)
      if (courseData.sections && courseData.sections.length > 0) {
        const firstSection = courseData.sections[0];
        if (firstSection.materials && firstSection.materials.length > 0) {
          setCurrentSection(firstSection);
          setCurrentMaterial(firstSection.materials[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [courseId, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch video stream data when material changes
  useEffect(() => {
    const fetchVideoData = async () => {
      if (!currentMaterial || currentMaterial.type !== "VIDEO" || !currentMaterial.video_id) {
        setVideoData(null);
        return;
      }

      try {
        setLoadingVideo(true);
        const token = getAuthToken();

        const response = await fetch(
          `/api/videos/stream/${currentMaterial.video_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Gagal memuat video");
        }

        const data = await response.json();
        setVideoData(data);
      } catch (err) {
        console.error("Error fetching video:", err);
        setVideoData(null);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchVideoData();
  }, [currentMaterial, getAuthToken]);

  // Fetch quiz data when material changes
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!currentMaterial || currentMaterial.type !== "QUIZ") {
        setQuizData(null);
        setQuizAttemptData(null);
        setQuizAnswers({});
        setQuizResult(null);
        setShowQuizResult(false);
        return;
      }

      try {
        setLoadingQuiz(true);
        const token = getAuthToken();

        // Fetch quiz questions
        const quizResponse = await fetch(`/api/materials/${currentMaterial.id}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (quizResponse.ok) {
          const quizInfo = await quizResponse.json();
          setQuizData(quizInfo);
        }

        // Fetch user's attempt history
        const attemptResponse = await fetch(`/api/materials/${currentMaterial.id}/quiz/attempt`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (attemptResponse.ok) {
          const attemptInfo = await attemptResponse.json();
          setQuizAttemptData(attemptInfo);
          if (attemptInfo.is_passed) {
            setShowQuizResult(true);
            setQuizResult({
              score: attemptInfo.best_score,
              is_passed: true,
              correct_answers: 0,
              total_questions: 0,
              attempts_remaining: attemptInfo.attempts_remaining,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizData();
  }, [currentMaterial, getAuthToken]);

  // Handle quiz answer selection
  const handleQuizAnswer = (questionId: string, label: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  // Submit quiz
  const handleQuizSubmit = async () => {
    if (!quizData || !currentMaterial) return;

    // Check if all questions are answered
    const unansweredCount = quizData.questions.filter((q) => !quizAnswers[q.id]).length;
    if (unansweredCount > 0) {
      alert(`Masih ada ${unansweredCount} pertanyaan yang belum dijawab`);
      return;
    }

    try {
      setSubmittingQuiz(true);
      const token = getAuthToken();

      const answers = Object.entries(quizAnswers).map(([question_id, selected]) => ({
        question_id,
        selected,
      }));

      const response = await fetch(`/api/materials/${currentMaterial.id}/quiz/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengirim jawaban");
      }

      const result = await response.json();
      setQuizResult(result);
      setShowQuizResult(true);

      // Update quiz attempt data
      setQuizAttemptData((prev) =>
        prev
          ? {
              ...prev,
              attempts_count: prev.attempts_count + 1,
              attempts_remaining: result.attempts_remaining,
              best_score: Math.max(prev.best_score, result.score),
              is_passed: prev.is_passed || result.is_passed,
            }
          : null
      );

      // Update enrollment progress if passed
      if (result.is_passed) {
        setEnrollment((prev) => {
          if (!prev) return prev;
          const existingRecord = prev.progress_records.find((p) => p.material_id === currentMaterial.id);
          if (existingRecord) {
            return {
              ...prev,
              progress_records: prev.progress_records.map((p) =>
                p.material_id === currentMaterial.id ? { ...p, is_completed: true } : p
              ),
            };
          } else {
            return {
              ...prev,
              progress_records: [
                ...prev.progress_records,
                {
                  id: "",
                  material_id: currentMaterial.id,
                  is_completed: true,
                  watched_duration: 0,
                  last_position: 0,
                },
              ],
            };
          }
        });
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert(err instanceof Error ? err.message : "Gagal mengirim jawaban");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Retry quiz
  const handleRetryQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setShowQuizResult(false);
  };

  // Handle material selection
  const handleMaterialSelect = (section: Section, material: Material) => {
    setCurrentSection(section);
    setCurrentMaterial(material);
  };

  // Check if material is completed
  const isMaterialCompleted = (materialId: string) => {
    if (!enrollment || !enrollment.progress_records) return false;
    return enrollment.progress_records.some(
      (p) => p.material_id === materialId && p.is_completed
    );
  };

  // Get material progress
  const getMaterialProgress = (materialId: string): ProgressRecord | null => {
    if (!enrollment || !enrollment.progress_records) return null;
    return enrollment.progress_records.find((p) => p.material_id === materialId) || null;
  };

  // Handle video progress save
  const handleVideoProgress = useCallback(
    async (position: number, duration: number) => {
      if (!currentMaterial) return;

      try {
        const token = getAuthToken();
        await fetch(`/api/videos/progress`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            material_id: currentMaterial.id,
            last_position: Math.floor(position),
            watched_duration: Math.floor(position),
          }),
        });
      } catch (err) {
        console.error("Error saving progress:", err);
      }
    },
    [currentMaterial, getAuthToken]
  );

  // Handle video completion
  const handleVideoComplete = useCallback(async () => {
    if (!currentMaterial) return;

    try {
      const token = getAuthToken();
      await fetch(`/api/videos/progress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material_id: currentMaterial.id,
          is_completed: true,
          last_position: currentMaterial.duration,
          watched_duration: currentMaterial.duration,
        }),
      });

      // Update local enrollment state
      setEnrollment((prev) => {
        if (!prev) return prev;
        const progressRecords = prev.progress_records || [];
        const existingRecord = progressRecords.find(
          (p) => p.material_id === currentMaterial.id
        );
        if (existingRecord) {
          return {
            ...prev,
            progress_records: progressRecords.map((p) =>
              p.material_id === currentMaterial.id ? { ...p, is_completed: true } : p
            ),
          };
        } else {
          return {
            ...prev,
            progress_records: [
              ...progressRecords,
              {
                id: "",
                material_id: currentMaterial.id,
                is_completed: true,
                watched_duration: currentMaterial.duration,
                last_position: currentMaterial.duration,
              },
            ],
          };
        }
      });
    } catch (err) {
      console.error("Error marking completion:", err);
    }
  }, [currentMaterial, getAuthToken]);

  // Mark any material as complete
  const markMaterialAsComplete = useCallback(async (material: Material) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/videos/progress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material_id: material.id,
          is_completed: true,
          last_position: material.duration || 0,
          watched_duration: material.duration || 0,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Error marking completion:", data.error);
        return;
      }

      console.log("Progress saved successfully:", data);

      // Update local enrollment state
      setEnrollment((prev) => {
        if (!prev) return prev;
        const progressRecords = prev.progress_records || [];
        const existingRecord = progressRecords.find(
          (p) => p.material_id === material.id
        );
        if (existingRecord) {
          return {
            ...prev,
            progress_records: progressRecords.map((p) =>
              p.material_id === material.id ? { ...p, is_completed: true } : p
            ),
          };
        } else {
          return {
            ...prev,
            progress_records: [
              ...progressRecords,
              {
                id: "",
                material_id: material.id,
                is_completed: true,
                watched_duration: material.duration || 0,
                last_position: material.duration || 0,
              },
            ],
          };
        }
      });
    } catch (err) {
      console.error("Error marking completion:", err);
    }
  }, [getAuthToken]);

  // Get all materials in flat array
  const getAllMaterials = useCallback(() => {
    if (!course) return [];
    const materials: { section: Section; material: Material }[] = [];
    course.sections.forEach((section) => {
      section.materials.forEach((material) => {
        materials.push({ section, material });
      });
    });
    return materials;
  }, [course]);

  // Get next material
  const getNextMaterial = useCallback(() => {
    const allMaterials = getAllMaterials();
    const currentIndex = allMaterials.findIndex(
      (m) => m.material.id === currentMaterial?.id
    );
    if (currentIndex < allMaterials.length - 1) {
      return allMaterials[currentIndex + 1];
    }
    return null;
  }, [getAllMaterials, currentMaterial]);

  // Get previous material
  const getPrevMaterial = useCallback(() => {
    const allMaterials = getAllMaterials();
    const currentIndex = allMaterials.findIndex(
      (m) => m.material.id === currentMaterial?.id
    );
    if (currentIndex > 0) {
      return allMaterials[currentIndex - 1];
    }
    return null;
  }, [getAllMaterials, currentMaterial]);

  // Handle next material - mark current as complete and go to next
  const handleNextMaterial = useCallback(async () => {
    console.log("handleNextMaterial called");
    console.log("Current material:", currentMaterial);
    console.log("Current enrollment:", enrollment);
    
    if (!currentMaterial) {
      console.log("No current material, returning");
      return;
    }

    // Mark current material as complete (for non-quiz materials)
    if (currentMaterial.type !== "QUIZ") {
      console.log("Marking material as complete:", currentMaterial.id);
      await markMaterialAsComplete(currentMaterial);
    }

    // Navigate to next material
    const next = getNextMaterial();
    if (next) {
      setCurrentSection(next.section);
      setCurrentMaterial(next.material);
    } else {
      console.log("No next material - this is the last one");
    }
  }, [currentMaterial, enrollment, markMaterialAsComplete, getNextMaterial]);

  // Handle previous material
  const handlePrevMaterial = useCallback(() => {
    const prev = getPrevMaterial();
    if (prev) {
      setCurrentSection(prev.section);
      setCurrentMaterial(prev.material);
    }
  }, [getPrevMaterial]);

  // Calculate overall progress
  const calculateProgress = () => {
    if (!course || !enrollment) return 0;

    let totalMaterials = 0;
    let completedMaterials = 0;

    course.sections.forEach((section) => {
      section.materials.forEach((material) => {
        totalMaterials++;
        if (isMaterialCompleted(material.id)) {
          completedMaterials++;
        }
      });
    });

    return totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get material type icon
  const getMaterialIcon = (type: string, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-4 w-4 text-[#008A00]" />;
    }
    if (isCurrent) {
      return <Play className="h-4 w-4 text-[#005EB8]" />;
    }
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4" />;
      case "ASSIGNMENT":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat kursus...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  if (error || !course) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {error || "Kursus tidak ditemukan"}
                </p>
                <Link href="/user/courses">
                  <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    Kembali ke Kursus
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
      <UserLayout>
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              {/* Button Kembali */}
              <div className="flex justify-center md:justify-start mb-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.history.back()} 
                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {course.mentor?.user?.full_name || "Mentor"} •{" "}
                {course.sections.reduce((acc, s) => acc + s.materials.length, 0)} pelajaran
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-4">
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="text-2xl font-bold text-[#005EB8]">{progress}%</p>
              </div>
              <Link href={`/user/courses/${courseId}/discussion`}>
                <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Diskusi
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="aspect-video bg-black relative">
                  {loadingVideo || loadingQuiz ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                    </div>
                  ) : currentMaterial?.type === "VIDEO" && videoData ? (
                    <VideoPlayer
                      key={`videoplayer-${currentMaterial.id}-${videoData.video_id}`}
                      videoId={videoData.video_id}
                      qualities={videoData.qualities}
                      defaultQuality={videoData.default_quality}
                      defaultUrl={videoData.default_url}
                      initialPosition={getMaterialProgress(currentMaterial.id)?.last_position || 0}
                      onProgress={handleVideoProgress}
                      onComplete={handleVideoComplete}
                      autoSaveInterval={10000}
                    />
                  ) : currentMaterial?.type === "VIDEO" && currentMaterial.youtube_url ? (
                    <iframe
                      className="w-full h-full"
                      src={(() => {
                        const url = currentMaterial.youtube_url;
                        // Handle youtu.be short URLs
                        if (url.includes("youtu.be/")) {
                          const videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
                          return `https://www.youtube.com/embed/${videoId}`;
                        }
                        // Handle youtube.com/watch URLs
                        if (url.includes("watch?v=")) {
                          const videoId = url.split("watch?v=")[1]?.split(/[?&]/)[0];
                          return `https://www.youtube.com/embed/${videoId}`;
                        }
                        // Handle youtube.com/embed URLs (already correct)
                        if (url.includes("/embed/")) {
                          return url;
                        }
                        return url;
                      })()}
                      title={currentMaterial.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : currentMaterial?.type === "DOCUMENT" && currentMaterial.document_url ? (
                    <iframe
                      className="w-full h-full bg-white"
                      src={currentMaterial.document_url.endsWith('.pdf') 
                        ? currentMaterial.document_url 
                        : `https://docs.google.com/viewer?url=${encodeURIComponent(currentMaterial.document_url)}&embedded=true`
                      }
                      title={currentMaterial.title}
                      style={{ minHeight: '100%' }}
                    />
                  ) : currentMaterial?.type === "DOCUMENT" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium mb-2">{currentMaterial.title}</p>
                      <p className="text-sm text-gray-400">Dokumen tidak tersedia</p>
                    </div>
                  ) : currentMaterial?.type === "QUIZ" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-blue-600 to-purple-700">
                      <HelpCircle className="h-16 w-16 mb-4" />
                      <p className="text-2xl font-bold mb-2">{quizData?.title || currentMaterial.title}</p>
                      {quizAttemptData && (
                        <div className="text-center">
                          <p className="text-sm opacity-80 mb-2">
                            {quizAttemptData.is_passed ? (
                              <span className="text-green-300">✓ Quiz Lulus</span>
                            ) : (
                              `Percobaan: ${quizAttemptData.attempts_count}/${quizAttemptData.max_attempts}`
                            )}
                          </p>
                          {quizAttemptData.best_score > 0 && (
                            <p className="text-sm">Nilai terbaik: {Math.round(quizAttemptData.best_score)}%</p>
                          )}
                        </div>
                      )}
                      <p className="text-sm opacity-70 mt-4">Scroll ke bawah untuk mengerjakan quiz</p>
                    </div>
                  ) : currentMaterial?.type === "ASSIGNMENT" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-orange-500 to-red-600">
                      <ClipboardList className="h-16 w-16 mb-4" />
                      <p className="text-2xl font-bold mb-2">{currentMaterial.title}</p>
                      <p className="text-sm opacity-80">Tugas</p>
                      <p className="text-sm opacity-70 mt-4">Scroll ke bawah untuk melihat instruksi</p>
                    </div>
                  ) : currentMaterial ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">{currentMaterial.title}</p>
                      {currentMaterial.content && (
                        <p className="text-sm text-gray-400 mt-2 max-w-md text-center">
                          {currentMaterial.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <p>Pilih materi untuk memulai</p>
                    </div>
                  )}
                </div>

                {/* Quiz Content Area */}
                {currentMaterial?.type === "QUIZ" && quizData && !showQuizResult && (
                  <div className="p-6 max-h-[500px] overflow-y-auto">
                    <div className="space-y-6">
                      {quizData.questions.map((question, qIndex) => (
                        <div key={question.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white mb-4">
                            {qIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => handleQuizAnswer(question.id, option.label)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                                  quizAnswers[question.id] === option.label
                                    ? "border-[#005EB8] bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                              >
                                <span className="font-medium mr-2">{option.label}.</span>
                                {option.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          {Object.keys(quizAnswers).length} / {quizData.questions.length} pertanyaan dijawab
                        </p>
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={submittingQuiz || (quizAttemptData?.attempts_remaining ?? 0) <= 0}
                          className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                        >
                          {submittingQuiz ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Kirim Jawaban
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quiz Result */}
                {currentMaterial?.type === "QUIZ" && showQuizResult && quizResult && (
                  <div className="p-6">
                    <div className={`p-6 rounded-lg text-center ${
                      quizResult.is_passed 
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}>
                      <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        quizResult.is_passed ? "bg-[#008A00]" : "bg-[#D93025]"
                      }`}>
                        {quizResult.is_passed ? (
                          <CheckCircle className="h-8 w-8 text-white" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <h3 className={`text-2xl font-bold mb-2 ${
                        quizResult.is_passed ? "text-[#008A00] dark:text-[#008A00]" : "text-[#D93025] dark:text-[#D93025]"
                      }`}>
                        {quizResult.is_passed ? "Selamat! Quiz Lulus" : "Belum Lulus"}
                      </h3>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {quizResult.score}%
                      </p>
                      {quizResult.total_questions > 0 && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {quizResult.correct_answers} dari {quizResult.total_questions} jawaban benar
                        </p>
                      )}
                      {!quizResult.is_passed && quizResult.attempts_remaining > 0 && (
                        <Button onClick={handleRetryQuiz} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Coba Lagi ({quizResult.attempts_remaining} percobaan tersisa)
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignment Content Area */}
                {currentMaterial?.type === "ASSIGNMENT" && (
                  <div className="p-6">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Instruksi Tugas</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {currentMaterial.content || "Tidak ada instruksi khusus."}
                      </p>
                      {currentMaterial.document_url && (
                        <a
                          href={currentMaterial.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download File Tugas
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Actions */}
                {currentMaterial?.type === "DOCUMENT" && currentMaterial.document_url && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentMaterial.title}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={currentMaterial.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* Button Buka di Tab Baru - Style diubah seperti button Lihat Semua di dashboard */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                        >
                          Buka di Tab Baru
                        </Button>
                      </a>
                      <a
                        href={currentMaterial.document_url}
                        download
                      >
                        <Button size="sm" className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentMaterial?.title || "Pilih Materi"}
                  </h2>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {currentMaterial && currentMaterial.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(currentMaterial.duration)}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {course.sections.reduce(
                          (acc, s) => acc + s.materials.filter((m) => isMaterialCompleted(m.id)).length,
                          0
                        )}
                        /{course.sections.reduce((acc, s) => acc + s.materials.length, 0)} selesai
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#005EB8] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevMaterial}
                      disabled={!getPrevMaterial()}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Materi {getAllMaterials().findIndex(m => m.material.id === currentMaterial?.id) + 1} dari {getAllMaterials().length}
                      </p>
                      {currentMaterial && isMaterialCompleted(currentMaterial.id) && (
                        <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>

                    {/* Show different buttons based on context */}
                    {currentMaterial?.type !== "QUIZ" && !isMaterialCompleted(currentMaterial?.id || "") ? (
                      // For non-completed, non-quiz materials
                      <Button
                        onClick={handleNextMaterial}
                        className="bg-[#005EB8] hover:bg-[#004A93] text-white gap-2"
                      >
                        <SkipForward className="h-4 w-4" />
                        {getNextMaterial() ? "Tandai Selesai & Lanjut" : "Tandai Selesai"}
                      </Button>
                    ) : (
                      // For completed materials or quizzes - only show next button
                      <Button
                        onClick={() => {
                          const next = getNextMaterial();
                          if (next) {
                            setCurrentSection(next.section);
                            setCurrentMaterial(next.material);
                          }
                        }}
                        disabled={!getNextMaterial()}
                        className="bg-[#005EB8] hover:bg-[#004A93] text-white gap-2"
                      >
                        Selanjutnya
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Review Form - Show when course is completed */}
              {course && (
                <CourseReviewForm
                  courseId={course.id}
                  courseTitle={course.title}
                  isCompleted={progress >= 100}
                />
              )}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab("materi")}
                        className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "materi"
                            ? "border-[#005EB8] text-[#005EB8]"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        Materi Pembelajaran
                      </button>
                      <button
                        onClick={() => setActiveTab("deskripsi")}
                        className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "deskripsi"
                            ? "border-[#005EB8] text-[#005EB8]"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        Deskripsi Kursus
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === "materi" && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          Materi Saat Ini
                        </h3>
                        {currentMaterial?.description && (
                          <p className="text-gray-700 dark:text-gray-300">
                            {currentMaterial.description}
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === "deskripsi" && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          Tentang Kursus Ini
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {course.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lessons List */}
            <div className="lg:col-span-1">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 sticky top-4">
                <CardContent className="p-0">
                  <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="font-bold text-gray-900 dark:text-white">
                      Daftar Pelajaran
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {course.sections.reduce((acc, s) => acc + s.materials.length, 0)} pelajaran •{" "}
                      {formatDuration(course.total_duration || 0)}
                    </CardDescription>
                  </CardHeader>

                  <div className="max-h-[600px] overflow-y-auto">
                    {course.sections.map((section, sectionIndex) => (
                      <div key={section.id}>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            Section {sectionIndex + 1}: {section.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {section.materials.length} materi • {formatDuration(section.duration)}
                          </p>
                        </div>
                        {section.materials.map((material, materialIndex) => {
                          const isCompleted = isMaterialCompleted(material.id);
                          const isCurrent = currentMaterial?.id === material.id;
                          const canAccess = material.is_free || enrollment;

                          return (
                            <div
                              key={material.id}
                              className={`p-4 border-b border-gray-200 dark:border-gray-700 transition-colors ${
                                isCurrent
                                  ? "bg-[#005EB8] bg-opacity-10 border-l-4 border-l-[#005EB8]"
                                  : canAccess
                                  ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                  : "opacity-50"
                              }`}
                              onClick={() => {
                                if (canAccess) {
                                  handleMaterialSelect(section, material);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isCompleted
                                      ? "bg-[#008A00] text-white"
                                      : isCurrent
                                      ? "bg-[#005EB8] text-white"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {isCompleted ? (
                                    "✓"
                                  ) : canAccess ? (
                                    materialIndex + 1
                                  ) : (
                                    <Lock className="h-3 w-3" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`font-medium ${
                                      isCurrent
                                        ? "text-[#005EB8]"
                                        : "text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {material.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getMaterialIcon(material.type, isCompleted, isCurrent)}
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatDuration(material.duration)}
                                    </span>
                                    {material.is_free && (
                                      <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none text-xs py-0">Gratis</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}