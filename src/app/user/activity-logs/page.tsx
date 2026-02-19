"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Search,
  Clock,
  Monitor,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  BookOpen,
  CreditCard,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Heart,
  Star,
  MessageSquare,
  Filter,
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  Mail,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/protected-route";
import Pagination from "@/components/ui/pagination";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const getActionConfig = (action: string) => {
  const configs: Record<string, { icon: typeof Activity; color: string; bgColor: string; label: string }> = {
    LOGIN: { icon: LogIn, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Login" },
    LOGOUT: { icon: LogOut, color: "text-gray-600", bgColor: "bg-gray-100", label: "Logout" },
    REGISTER: { icon: User, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Registrasi" },
    RESEND_VERIFICATION: { icon: Mail, color: "text-purple-600", bgColor: "bg-purple-100", label: "Resend Verification" },
    PROFILE_UPDATE: { icon: Edit, color: "text-purple-600", bgColor: "bg-purple-100", label: "Update Profil" },
    PASSWORD_CHANGE: { icon: Settings, color: "text-orange-600", bgColor: "bg-orange-100", label: "Ubah Password" },
    COURSE_VIEW: { icon: Eye, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Lihat Kursus" },
    COURSE_ENROLL: { icon: BookOpen, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Enroll Kursus" },
    COURSE_COMPLETE: { icon: Star, color: "text-[#F4B400]", bgColor: "bg-[#F4B400]/10", label: "Selesai Kursus" },
    PAYMENT_CREATE: { icon: CreditCard, color: "text-orange-600", bgColor: "bg-orange-100", label: "Buat Pembayaran" },
    PAYMENT_SUCCESS: { icon: CreditCard, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Pembayaran Berhasil" },
    WISHLIST_ADD: { icon: Heart, color: "text-[#D93025]", bgColor: "bg-[#D93025]/10", label: "Tambah Wishlist" },
    WISHLIST_REMOVE: { icon: Heart, color: "text-gray-600", bgColor: "bg-gray-100", label: "Hapus Wishlist" },
    REVIEW_CREATE: { icon: MessageSquare, color: "text-purple-600", bgColor: "bg-purple-100", label: "Tulis Review" },
    CERTIFICATE_DOWNLOAD: { icon: Download, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Download Sertifikat" },
    FILE_UPLOAD: { icon: Upload, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Upload File" },
  };
  return configs[action] || { icon: Activity, color: "text-gray-600", bgColor: "bg-gray-100", label: action };
};

const parseUserAgent = (userAgent: string | null) => {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "MacOS";
  if (userAgent.includes("Linux")) return "Linux";
  return "Desktop";
};

const groupByDate = (activities: ActivityLog[]) => {
  const grouped: Record<string, ActivityLog[]> = {};
  activities.forEach((activity) => {
    const date = formatDate(activity.created_at);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(activity);
  });
  return grouped;
};

export default function UserActivityLogs() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchActivities = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) { setError("Silakan login terlebih dahulu"); return; }
      const response = await fetch(`/api/users/activity?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil data aktivitas");
      const data = await response.json();
      setActivities(data.activities || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  }, [getAuthToken]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) || (activity.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesAction = filterAction === "all" || activity.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const groupedActivities = groupByDate(filteredActivities);
  const uniqueActions = [...new Set(activities.map((a) => a.action))];

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage);
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
                <Activity className="h-8 w-8 text-[#005EB8]" />
                Log Aktivitas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Riwayat aktivitas akun Anda</p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {pagination.total} Aktivitas
            </Badge>
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
                    <Activity className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Aktivitas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <LogIn className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Login</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activities.filter((a) => a.action === "LOGIN").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <BookOpen className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activities.filter((a) => a.action.includes("COURSE")).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <CreditCard className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pembayaran</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activities.filter((a) => a.action.includes("PAYMENT")).length}
                    </p>
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
                    placeholder="Cari aktivitas berdasarkan jenis atau entitas..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10"
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-full md:w-[240px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Jenis Aktivitas" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[240px]">
                    <SelectItem value="all">Semua Aktivitas</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionConfig(action).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          {Object.keys(groupedActivities).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#005EB8]" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{date}</h3>
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none ml-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                          {dayActivities.length} aktivitas
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {dayActivities.map((activity, index) => {
                      const config = getActionConfig(activity.action);
                      const ActionIcon = config.icon;
                      return (
                        <div key={activity.id} className="relative">
                          <div className={`absolute -left-[21px] top-5 w-4 h-4 rounded-full ${config.bgColor} flex items-center justify-center`}>
                            <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`}></div>
                          </div>
                          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                    <ActionIcon className={`h-5 w-5 ${config.color}`} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                                    {activity.entity_type && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {activity.entity_type}: {activity.entity_id?.substring(0, 8)}...
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-900 dark:text-white font-medium">{formatTime(activity.created_at)}</p>
                                  <div className="flex flex-col md:items-end gap-1 mt-2">
                                    {activity.ip_address && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {activity.ip_address}
                                      </p>
                                    )}
                                    {activity.user_agent && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Monitor className="h-3 w-3" />
                                        {parseUserAgent(activity.user_agent)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Activity className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterAction !== "all" ? "Tidak ada aktivitas ditemukan" : "Belum ada aktivitas"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || filterAction !== "all" ? "Coba ubah filter pencarian Anda" : "Log aktivitas akan muncul di sini"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination - Menggunakan komponen terpisah */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}