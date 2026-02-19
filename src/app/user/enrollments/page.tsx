"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Search,
  Clock,
  ChevronRight,
  Loader2,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Award,
  Filter,
  Calendar,
  ArrowUpRight,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/protected-route";

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress: number;
  completed_at: string | null;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    total_duration: number;
    total_lectures: number;
    mentor: { user: { full_name: string; avatar_url: string | null } };
  };
  certificate: { id: string; certificate_number: string; status: string; issued_at: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

const getStatusBadge = (status: string, progress: number) => {
  if (progress >= 100) return { 
    label: "Selesai", 
    className: "bg-[#008A00] text-white border-[#008A00] pointer-events-none" 
  };
  if (status === "ACTIVE") return { 
    label: "Aktif", 
    className: "bg-[#005EB8] text-white border-[#005EB8] pointer-events-none" 
  };
  if (status === "EXPIRED") return { 
    label: "Kadaluarsa", 
    className: "bg-[#D93025] text-white border-[#D93025] pointer-events-none" 
  };
  if (status === "SUSPENDED") return { 
    label: "Ditangguhkan", 
    className: "bg-[#F4B400] text-[#1A1A1A] border-[#F4B400] pointer-events-none" 
  };
  return { 
    label: status, 
    className: "bg-gray-100 text-gray-800 border-gray-300 pointer-events-none" 
  };
};

export default function UserEnrollments() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchEnrollments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) { setError("Silakan login terlebih dahulu"); return; }
      
      let url = `/api/users/enrollments?page=${page}&limit=10`;
      if (filterStatus !== "all") url += `&status=${filterStatus}`;
      
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil data enrollments");
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  }, [getAuthToken, filterStatus]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course.mentor.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: pagination.total,
    active: enrollments.filter((e) => e.status === "ACTIVE" && e.progress < 100).length,
    completed: enrollments.filter((e) => e.progress >= 100).length,
    withCertificate: enrollments.filter((e) => e.certificate).length,
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <GraduationCap className="h-8 w-8 text-[#005EB8]" />
                Enrollments Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola semua kursus yang Anda ikuti</p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <PlayCircle className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sedang Belajar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selesai</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Award className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sertifikat</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withCertificate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="search" 
                    placeholder="Cari kursus atau mentor..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={filterStatus} 
                  onValueChange={(v) => { 
                    setFilterStatus(v); 
                    fetchEnrollments(1); 
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                    <SelectItem value="EXPIRED">Kadaluarsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enrollments List */}
          {filteredEnrollments.length > 0 ? (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment) => {
                const statusBadge = getStatusBadge(enrollment.status, enrollment.progress);
                return (
                  <Card 
                    key={enrollment.id} 
                    className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Thumbnail */}
                        <div className="relative w-full md:w-64 aspect-video md:aspect-auto md:h-36 flex-shrink-0">
                          {enrollment.course.thumbnail ? (
                            <img
                              src={enrollment.course.thumbnail}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {enrollment.progress >= 100 && (
                            <div className="absolute inset-0 bg-[#008A00]/20 flex items-center justify-center">
                              <CheckCircle className="h-12 w-12 text-[#008A00]" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                                {enrollment.certificate && (
                                  <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none">
                                    <Award className="h-3 w-3 mr-1" />Bersertifikat
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                {enrollment.course.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                oleh {enrollment.course.mentor.user.full_name}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatDuration(enrollment.course.total_duration)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-4 w-4" />
                                  {enrollment.course.total_lectures} materi
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Enroll {formatDate(enrollment.created_at)}
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2 max-w-md">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{Math.round(enrollment.progress)}%</span>
                                </div>
                                <Progress value={enrollment.progress} className="h-2" />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              <Button
                                onClick={() => router.push(`/user/enrollments/${enrollment.id}`)}
                                className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                              >
                                Detail
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                              <Button 
                                variant="outline" 
                                asChild
                                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Link href={`/user/courses/${enrollment.course.id}/player`}>
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Lanjut Belajar
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <GraduationCap className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterStatus !== "all" ? "Tidak ditemukan" : "Belum ada enrollment"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || filterStatus !== "all" ? "Coba ubah filter pencarian Anda" : "Mulai belajar sekarang"}
                    </p>
                    <Button 
                      asChild 
                      className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                    >
                      <Link href="/courses">
                        Jelajahi Kursus
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => fetchEnrollments(pagination.page - 1)} 
                disabled={pagination.page <= 1}
                className="border-gray-300 dark:border-gray-600"
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => fetchEnrollments(pagination.page + 1)} 
                disabled={pagination.page >= pagination.totalPages}
                className="border-gray-300 dark:border-gray-600"
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}