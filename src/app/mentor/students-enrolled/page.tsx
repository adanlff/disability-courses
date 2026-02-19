"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BookOpen,
  Mail,
  GraduationCap,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

interface Student {
  id: string;
  progress: number;
  created_at: string;
  last_accessed_at: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Belum pernah";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  return formatDate(dateString);
};

export default function StudentsEnrolledPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch courses for filter
  const fetchCourses = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/mentors/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, [getAuthToken]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/mentors/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data siswa");

      const data = await response.json();
      setStudents(data.students || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students locally
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || student.course.id === courseFilter;

    return matchesSearch && matchesCourse;
  });

  // Stats
  const totalStudents = pagination.total;
  const activeStudents = students.filter((s) => s.last_accessed_at && new Date(s.last_accessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0;
  const completedStudents = students.filter((s) => s.progress >= 100).length;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-[#008A00]";
    if (progress >= 50) return "bg-[#F4B400]";
    if (progress >= 25) return "bg-[#005EB8]";
    return "bg-gray-300";
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) {
      return <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">Selesai</Badge>;
    } else if (progress > 0) {
      return <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">Berlangsung</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Belum Mulai</Badge>;
    }
  };

  if (loading && students.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Users className="h-8 w-8 text-[#005EB8]" />
              Siswa Terdaftar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan pantau progres siswa yang mengikuti kursus Anda
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Siswa</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <TrendingUp className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif (7 hari)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Clock className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <GraduationCap className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selesai</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">
              <CardContent className="p-4">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Students Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5 text-[#005EB8]" />
                    Daftar Siswa
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {filteredStudents.length} siswa ditemukan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari nama, email, atau kursus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full md:w-[200px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Filter kursus" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] w-full">
                      <SelectItem value="all" className="truncate">
                        Semua Kursus
                      </SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id} className="truncate">
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Siswa</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || courseFilter !== "all"
                      ? "Tidak ada siswa yang cocok dengan filter"
                      : "Siswa akan muncul setelah ada yang mendaftar kursus Anda"}
                  </p>
                  {(searchTerm || courseFilter !== "all") && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setCourseFilter("all");
                      }}
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {filteredStudents.map((student) => (
                      <Card key={student.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: Student Info & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                {student.user.avatar_url ? (
                                  <img
                                    src={student.user.avatar_url}
                                    alt={student.user.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold">
                                    {student.user.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {student.progress >= 100 && (
                                  <div className="absolute -bottom-1 -right-1 bg-[#008A00] rounded-full p-0.5">
                                    <GraduationCap className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {student.user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {student.user.email}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(student.progress)}
                          </div>

                          {/* Course */}
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {student.course.title}
                            </p>
                          </div>

                          {/* Progress */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getProgressColor(student.progress)} transition-all`}
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer: Dates */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Terdaftar</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {formatDate(student.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir Aktif</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {formatTimeAgo(student.last_accessed_at)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[200px] px-4 py-3">
                          Siswa
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[200px] px-4 py-3">
                          Email
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[180px] px-4 py-3">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[150px] px-4 py-3">
                          Progress
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3">
                          Terdaftar
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3">
                          Terakhir Aktif
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-center">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                {student.user.avatar_url ? (
                                  <img
                                    src={student.user.avatar_url}
                                    alt={student.user.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold">
                                    {student.user.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {student.progress >= 100 && (
                                  <div className="absolute -bottom-1 -right-1 bg-[#008A00] rounded-full p-0.5">
                                    <GraduationCap className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate" title={student.user.full_name}>
                                  {student.user.full_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex items-center gap-1" title={student.user.email}>
                                {student.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white truncate flex items-center gap-1" title={student.course.title}>
                                {student.course.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                                <div
                                  className={`h-full ${getProgressColor(student.progress)} transition-all`}
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                                {student.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(student.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              {formatTimeAgo(student.last_accessed_at)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              {getStatusBadge(student.progress)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
                  </div>
                </>
              )}

              {/* Pagination - Diganti dengan komponen Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}