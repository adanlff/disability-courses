"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Trophy,
  Clock,
  Star,
  Play,
  BookOpen,
  Heart,
  Activity,
  ArrowRight,
  Loader2,
  TrendingUp,
  Calendar,
  ChevronRight,
  Award,
  CreditCard,
  User,
  Sparkles,
  Eye,
  Search,
  Settings,
  MessageSquare,
  FileText,
  PlayCircle,
  Mail,
  Shield,
  Zap,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface Enrollment {
  id: string;
  progress: number;
  status: string;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    total_duration: number;
    mentor: { user: { full_name: string } };
  };
}

interface WishlistItem {
  id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    price: number;
    mentor: { user: { full_name: string } };
  };
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
}

interface UserProfile {
  full_name: string;
  avatar_url: string | null;
  email?: string;
  role?: string;
  status?: string;
}

interface DashboardStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalCertificates: number;
  totalWishlist: number;
  averageProgress: number;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};
const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    LOGIN: "Login ke akun",
    LOGOUT: "Logout dari akun",
    COURSE_VIEW: "Melihat kursus",
    COURSE_ENROLL: "Enroll kursus",
    PAYMENT_SUCCESS: "Pembayaran berhasil",
    WISHLIST_ADD: "Menambahkan ke wishlist",
    PROFILE_UPDATE: "Update profil",
  };
  return labels[action] || action;
};

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalEnrollments: 0, activeEnrollments: 0, completedEnrollments: 0, totalCertificates: 0, totalWishlist: 0, averageProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Selamat Datang");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all data in parallel
        const [profileRes, enrollmentsRes, wishlistRes, activityRes, certificatesRes] = await Promise.all([
          fetch(`/api/users/profile`, { headers }),
          fetch(`/api/users/enrollments?limit=5`, { headers }),
          fetch(`/api/wishlist?limit=4`, { headers }),
          fetch(`/api/users/activity?limit=5`, { headers }),
          fetch(`/api/users/certificates`, { headers }),
        ]);

        // Parse responses
        const profileData = profileRes.ok ? await profileRes.json() : null;
        const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : { enrollments: [], pagination: { total: 0 } };
        const wishlistData = wishlistRes.ok ? await wishlistRes.json() : { wishlist: [], pagination: { total: 0 } };
        const activityData = activityRes.ok ? await activityRes.json() : { activities: [] };
        const certificatesData = certificatesRes.ok ? await certificatesRes.json() : { certificates: [], pagination: { total: 0 } };

        // Set data
        if (profileData?.user) setProfile(profileData.user);
        setEnrollments(enrollmentsData.enrollments || []);
        setWishlist(wishlistData.wishlist || []);
        setActivities(activityData.activities || []);

        // Calculate stats
        const allEnrollments = enrollmentsData.enrollments || [];
        const completed = allEnrollments.filter((e: Enrollment) => e.progress >= 100).length;
        const active = allEnrollments.filter((e: Enrollment) => e.status === "ACTIVE" && e.progress < 100).length;
        const avgProgress = allEnrollments.length > 0 ? allEnrollments.reduce((sum: number, e: Enrollment) => sum + e.progress, 0) / allEnrollments.length : 0;

        setStats({
          totalEnrollments: enrollmentsData.pagination?.total || 0,
          activeEnrollments: active,
          completedEnrollments: completed,
          totalCertificates: certificatesData.pagination?.total || certificatesData.certificates?.length || 0,
          totalWishlist: wishlistData.pagination?.total || 0,
          averageProgress: Math.round(avgProgress),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getAuthToken]);

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
          {/* Welcome Header */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{greeting},</p>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile?.full_name || "Learner"} 👋</h1>
                  <p className="text-gray-600 dark:text-gray-400">Lanjutkan perjalanan belajar Anda hari ini!</p>
                </div>
                <div className="flex gap-3">
                  <Button asChild className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <Link href="/courses"><Sparkles className="h-4 w-4 mr-2" />Jelajahi Kursus</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Kursus - Primary */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEnrollments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sedang Belajar - Accent */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <TrendingUp className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sedang Belajar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeEnrollments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Selesai - Success */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Trophy className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selesai</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedEnrollments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sertifikat - Danger */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Award className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sertifikat</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCertificates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Lanjutkan Belajar dan Wishlist */}
            <div className="lg:col-span-2 space-y-6">
              {/* Continue Learning */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-[350px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Play className="h-5 w-5 text-[#005EB8]" />
                      Lanjutkan Belajar
                    </CardTitle>
                    <CardDescription>Kursus yang sedang Anda ikuti</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    asChild 
                    size="sm"
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Link href="/user/enrollments">
                      Lihat Semua
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {enrollments.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Hanya menampilkan 2 course pertama */}
                      {enrollments.slice(0, 2).map((enrollment) => (
                        <div key={enrollment.id} className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            {enrollment.course.thumbnail ? (
                              <img
                                src={enrollment.course.thumbnail}
                                alt={enrollment.course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{enrollment.course.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course.mentor.user.full_name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                              <span className="text-xs font-medium text-[#005EB8]">{Math.round(enrollment.progress)}%</span>
                            </div>
                          </div>
                          {/* Button Lanjut Belajar */}
                          <Button 
                            asChild
                            size="sm"
                            className="bg-[#005EB8] hover:bg-[#004A93] text-white self-center"
                          >
                            <Link href={`/user/courses/${enrollment.course.id}/player`}>
                              <PlayCircle className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Lanjut Belajar</span>
                              <span className="sm:hidden">Lanjut</span>
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 h-full flex flex-col justify-center">
                      <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada kursus yang diikuti</p>
                      <Button asChild className="bg-[#005EB8] hover:bg-[#004A93] mx-auto">
                        <Link href="/courses">Mulai Belajar</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wishlist */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-[320px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Heart className="h-5 w-5 text-[#D93025]" />
                      Wishlist Saya
                    </CardTitle>
                    <CardDescription>Kursus yang Anda simpan</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    asChild 
                    size="sm"
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Link href="/user/wishlist">
                      Lihat Semua
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {wishlist.slice(0, 4).map((item) => (
                        <Link key={item.id} href={`/courses/${item.course.slug}`} className="group">
                          <div className="relative aspect-video rounded-lg overflow-hidden mb-2 border border-gray-200 dark:border-gray-700">
                            {item.course.thumbnail ? (
                              <img
                                src={item.course.thumbnail}
                                alt={item.course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#005EB8]">
                            {item.course.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.course.mentor.user.full_name}</p>
                          <p className="text-sm font-semibold text-[#005EB8] mt-1">
                            {item.course.price > 0 ? formatCurrency(item.course.price) : "Gratis"}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 h-full flex flex-col justify-center">
                      <Heart className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada kursus di wishlist</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Progress Overview */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-[350px] flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Star className="h-5 w-5 text-[#F4B400]" />
                      Overview Progress
                    </CardTitle>
                    <CardDescription>Progress rata-rata kursus Anda</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                  <div className="flex flex-col items-center mb-4 flex-1 justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          stroke="currentColor" 
                          strokeWidth="12" 
                          fill="none" 
                          strokeDasharray={`${(stats.averageProgress / 100) * 352} 352`} 
                          strokeLinecap="round" 
                          className="text-[#005EB8]" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageProgress}%</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Aktif</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.activeEnrollments} kursus</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Selesai</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.completedEnrollments} kursus</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sertifikat</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.totalCertificates} diperoleh</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-[320px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Activity className="h-5 w-5 text-[#008A00]" />
                      Aktivitas Terbaru
                    </CardTitle>
                    <CardDescription>Aktivitas terbaru di akun Anda</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    asChild 
                    size="sm"
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Link href="/user/activity-logs">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {activities.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-[#005EB8] mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">{getActionLabel(activity.action)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 h-full flex flex-col justify-center">
                      <Activity className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada aktivitas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Aksi Cepat */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <Zap className="h-5 w-5 text-[#005EB8]" />
                Aksi Cepat
              </CardTitle>
              <CardDescription>Kelola akun dan pembelajaran Anda</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/user/enrollments" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#005EB8]/10 mb-3">
                        <GraduationCap className="h-6 w-6 text-[#005EB8]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Enrollment</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lihat semua kursus Anda</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/user/certificates" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#D93025]/10 mb-3">
                        <Award className="h-6 w-6 text-[#D93025]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Sertifikat</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sertifikat Anda</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/user/transaction" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#008A00]/10 mb-3">
                        <CreditCard className="h-6 w-6 text-[#008A00]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Transaksi</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Riwayat pembayaran</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/user/profile" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#F4B400]/10 mb-3">
                        <User className="h-6 w-6 text-[#F4B400]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Edit Profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola akun Anda</p>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}