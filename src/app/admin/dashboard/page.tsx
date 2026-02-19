"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  GraduationCap,
  UserCheck,
  Clock,
  Star,
  FileText,
  Activity,
  ArrowRight,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  MessageSquare,
  Award,
  Sparkles,
  BarChart3,
  Eye,
  Shield,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface DashboardStats {
  total_users: number;
  total_mentors: number;
  total_courses: number;
  total_revenue: number;
}

interface UsersByRole {
  role: string;
  _count: { id: number };
}

interface CoursesByStatus {
  status: string;
  _count: { id: number };
}

interface RecentEnrollment {
  id: string;
  created_at: string;
  user: { full_name: string };
  course: { title: string };
}

interface PendingMentor {
  id: string;
  user: { full_name: string; email: string; avatar_url: string | null };
  created_at: string;
}

interface PendingCourse {
  id: string;
  title: string;
  mentor: { user: { full_name: string } };
  created_at: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
};

const formatShortCurrency = (amount: number) => {
  if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
  if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}Rb`;
  return `Rp ${amount}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(dateString);
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  else if (hour < 15) return "Selamat Siang";
  else if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usersByRole, setUsersByRole] = useState<UsersByRole[]>([]);
  const [coursesByStatus, setCoursesByStatus] = useState<CoursesByStatus[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [pendingMentors, setPendingMentors] = useState<PendingMentor[]>([]);
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, mentorsRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/dashboard`, { headers }),
        fetch(`/api/admin/mentors?status=PENDING&limit=5`, { headers }),
        fetch(`/api/admin/courses?status=PENDING_REVIEW&limit=5`, { headers }),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats(data.stats);
        setUsersByRole(data.users_by_role || []);
        setCoursesByStatus(data.courses_by_status || []);
        setRecentEnrollments(data.recent_enrollments || []);
      }

      if (mentorsRes.ok) {
        const data = await mentorsRes.json();
        setPendingMentors(data.mentors || []);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setPendingCourses(data.data || data.courses || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-[#D93025]";
      case "MENTOR": return "bg-[#005EB8]";
      case "STUDENT": return "bg-[#008A00]";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-[#008A00]";
      case "PENDING_REVIEW": return "bg-[#F4B400]";
      case "DRAFT": return "bg-gray-500";
      case "ARCHIVED": return "bg-[#D93025]";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "Publik";
      case "PENDING_REVIEW": return "Menunggu";
      case "DRAFT": return "Draft";
      case "ARCHIVED": return "Arsip";
      default: return status;
    }
  };

  const totalCourses = coursesByStatus.reduce((sum, c) => sum + c._count.id, 0);
  const totalUsers = usersByRole.reduce((sum, u) => sum + u._count.id, 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600">Memuat dashboard...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{getGreeting()},</p>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin 👋</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Pantau performa platform dan kelola konten dengan mudah
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Stats Cards dengan warna tema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengguna</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_users || 0}</p>
                  </div>
                </div>
                <Link 
                  href="/admin/users" 
                  className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#004A93] mt-3"
                >
                  Kelola <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Active Mentors */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <UserCheck className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mentor Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_mentors || 0}</p>
                  </div>
                </div>
                <Link 
                  href="/admin/mentors" 
                  className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#004A93] mt-3"
                >
                  Kelola <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Public Courses */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <BookOpen className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kursus Publik</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_courses || 0}</p>
                  </div>
                </div>
                <Link 
                  href="/admin/courses" 
                  className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#004A93] mt-3"
                >
                  Kelola <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <TrendingUp className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatShortCurrency(stats?.total_revenue || 0)}</p>
                  </div>
                </div>
                <Link 
                  href="/admin/reports" 
                  className="flex items-center gap-1 text-sm text-[#005EB8] hover:text-[#004A93] mt-3"
                >
                  Lihat Laporan <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Pending Items Row */}
          {(pendingMentors.length > 0 || pendingCourses.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Mentors */}
              {pendingMentors.length > 0 && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#F4B400]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#F4B400]/10">
                        <Clock className="h-4 w-4 text-[#F4B400]" />
                      </div>
                      Mentor Menunggu Persetujuan
                      <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none ml-auto">{pendingMentors.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingMentors.slice(0, 3).map((mentor) => (
                        <div key={mentor.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          {mentor.user.avatar_url ? (
                            <div className="relative w-10 h-10">
                              <Image 
                                src={mentor.user.avatar_url} 
                                alt={mentor.user.full_name} 
                                fill 
                                className="rounded-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-medium text-sm">
                              {mentor.user.full_name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{mentor.user.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(mentor.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/admin/mentors?status=PENDING">
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:hover:bg-[#005EB8]/20 dark:text-white dark:border-[#005EB8]"
                        size="sm"
                      >
                        Lihat Semua <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Pending Courses */}
              {pendingCourses.length > 0 && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#F4B400]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#F4B400]/10">
                        <FileText className="h-4 w-4 text-[#F4B400]" />
                      </div>
                      Kursus Menunggu Review
                      <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none ml-auto">{pendingCourses.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingCourses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-[#008A00]/10 dark:bg-[#008A00]/20 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-[#008A00]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{course.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              oleh {course.mentor?.user?.full_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/admin/courses?status=PENDING_REVIEW">
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:hover:bg-[#005EB8]/20 dark:text-white dark:border-[#005EB8]"
                        size="sm"
                      >
                        Review Semua <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Users by Role */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#005EB8]" />
                    Distribusi Pengguna
                  </CardTitle>
                  <CardDescription>Distribusi pengguna berdasarkan peran</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {usersByRole.map((role) => {
                    const pct = totalUsers > 0 ? (role._count.id / totalUsers) * 100 : 0;
                    return (
                      <div key={role.role} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${getRoleColor(role.role)}`} />
                            {role.role === "ADMIN" ? "Admin" : 
                             role.role === "MENTOR" ? "Mentor" : 
                             role.role === "STUDENT" ? "Student" : role.role}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{role._count.id} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${getRoleColor(role.role)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Courses by Status */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#008A00]" />
                    Status Kursus
                  </CardTitle>
                  <CardDescription>Status distribusi semua kursus</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {coursesByStatus.map((status) => {
                    const pct = totalCourses > 0 ? (status._count.id / totalCourses) * 100 : 0;
                    return (
                      <div key={status.status} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                            {getStatusLabel(status.status)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{status._count.id} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${getStatusColor(status.status)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3 border-b">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#008A00]" />
                  Pendaftaran Terbaru
                </CardTitle>
                <CardDescription>Siswa yang baru mendaftar ke kursus</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentEnrollments.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Belum ada pendaftaran</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentEnrollments.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[#008A00]/10 dark:bg-[#008A00]/20 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-[#008A00]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium text-[#005EB8]">{enrollment.user.full_name}</span>
                          <span className="text-gray-600 dark:text-gray-300"> mendaftar ke </span>
                          <span className="font-medium text-gray-900 dark:text-white">{enrollment.course.title}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimeAgo(enrollment.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3 border-b">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <Zap className="h-5 w-5 text-[#005EB8]" />
                  Aksi Cepat
                </CardTitle>
                <CardDescription>Kelola platform dengan cepat</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/admin/users" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#005EB8]/10 mb-3">
                        <Users className="h-6 w-6 text-[#005EB8]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Kelola Users</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola semua pengguna</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/admin/mentors" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#F4B400]/10 mb-3">
                        <UserCheck className="h-6 w-6 text-[#F4B400]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Kelola Mentors</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola semua mentor</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/admin/courses" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#008A00]/10 mb-3">
                        <BookOpen className="h-6 w-6 text-[#008A00]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Kelola Kursus</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review dan kelola kursus</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/admin/reports" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#D93025]/10 mb-3">
                        <TrendingUp className="h-6 w-6 text-[#D93025]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Lihat Laporan</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analitik dan laporan</p>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}