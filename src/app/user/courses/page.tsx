"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Search, Filter, Clock, CheckCircle, Star, Loader2, BookOpen, GraduationCap, ArrowUpRight, Sparkles, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/protected-route";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  level: string;
  category: {
    id: string;
    name: string;
  } | null;
  mentor: {
    user: {
      full_name: string;
    };
  } | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  status: string;
  last_accessed_at: string | null;
  created_at: string;
  course: Course;
  _count?: {
    progress_records: number;
  };
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 menit';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

const formatLastAccessed = (date: string | null) => {
  if (!date) return 'Belum diakses';
  const lastDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return lastDate.toLocaleDateString('id-ID');
};

export default function UserCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          return;
        }

        const response = await fetch(`/api/users/enrollments?recalculate=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data kursus");
        }

        const data = await response.json();
        setEnrollments(data.enrollments || []);

        // Extract unique categories
        const uniqueCategories = new Map();
        (data.enrollments || []).forEach((enrollment: Enrollment) => {
          if (enrollment.course.category) {
            uniqueCategories.set(enrollment.course.category.id, enrollment.course.category);
          }
        });
        setCategories(Array.from(uniqueCategories.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [getAuthToken]);

  // Filter and sort enrollments
  const filteredEnrollments = enrollments
    .filter((enrollment) => {
      const matchesSearch = enrollment.course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || enrollment.course.category?.id === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "progress") {
        return b.progress - a.progress;
      } else if (sortBy === "title") {
        return a.course.title.localeCompare(b.course.title);
      } else {
        // recent - sort by last accessed
        const dateA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
        const dateB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
        return dateB - dateA;
      }
    });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-[#008A00]";
    if (progress >= 50) return "bg-[#F4B400]";
    return "bg-[#005EB8]";
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
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

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <GraduationCap className="h-8 w-8 text-[#005EB8]" />
                Kursus Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola dan lanjutkan pembelajaran Anda
              </p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {enrollments.length} Kursus Terdaftar
            </Badge>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Cari kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Terbaru Diakses</SelectItem>
                      <SelectItem value="progress">
                        Progress Tertinggi
                      </SelectItem>
                      <SelectItem value="title">Nama A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid untuk course cards */}
          {filteredEnrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrollments.map((enrollment, index) => (
                <Card
                  key={enrollment.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col"
                >
                  <div className="relative flex-shrink-0">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none text-xs font-medium px-3 py-1">
                      {enrollment.course.category?.name || 'Kategori'}
                    </Badge>
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-white rounded-full text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(enrollment.course.total_duration)}
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {enrollment.course.mentor?.user?.full_name || 'Instruktur'}
                      </p>

                      <div className="flex items-center gap-4 text-sm mb-4">
                        {enrollment.course.average_rating > 0 && (
                          <div className="flex items-center gap-1 text-[#F4B400]">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">{enrollment.course.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            {Math.round(enrollment.progress)}% selesai
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Progress
                          </span>
                          <span className="font-bold text-[#005EB8]">
                            {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(
                              enrollment.progress
                            )} rounded-full transition-all duration-500`}
                            style={{ width: `${enrollment.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastAccessed(enrollment.last_accessed_at)}
                      </span>
                      <Link href={`/user/courses/${enrollment.course.id}/player`}>
                        <Button
                          size="sm"
                          className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {enrollment.progress > 0 ? 'Lanjutkan' : 'Mulai'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Card untuk keadaan kosong - dengan padding yang sama atas bawah
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterCategory !== 'all'
                        ? 'Tidak ada kursus ditemukan'
                        : 'Belum ada kursus'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || filterCategory !== 'all'
                        ? 'Coba ubah filter atau kata kunci pencarian Anda'
                        : 'Mulai belajar dengan mendaftar kursus pertama Anda'}
                    </p>
                  </div>
                  {(!searchTerm && filterCategory === 'all') && (
                    <Link href="/courses">
                      <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Jelajahi Lebih Banyak Kursus */}
          <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                <div className="text-center md:text-left w-full md:w-auto">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-white flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Jelajahi Lebih Banyak Kursus
                    </h3>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base">
                    Temukan ribuan kursus berkualitas untuk meningkatkan keterampilan Anda
                  </p>
                </div>
                <Link href="/courses" className="w-full sm:w-auto flex-shrink-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-[#005EB8] hover:bg-gray-100 font-semibold"
                  >
                    Lihat Semua Kursus
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}