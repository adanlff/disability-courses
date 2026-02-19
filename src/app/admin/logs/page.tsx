"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Search,
  Loader2,
  Calendar,
  User,
  Filter,
  Clock,
  FileText,
  LogIn,
  LogOut,
  UserPlus,
  BookOpen,
  CreditCard,
  Star,
  Settings,
  Trash2,
  Edit,
  Eye,
  Download,
  AlertCircle,
  Globe,
  Monitor,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActionConfig = (action: string) => {
  const actionLower = action.toLowerCase();
  const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    login: { icon: LogIn, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Login" },
    logout: { icon: LogOut, color: "text-gray-600", bgColor: "bg-gray-100", label: "Logout" },
    register: { icon: UserPlus, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Registrasi" },
    "user_apply": { icon: UserPlus, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Apply User" },
    course: { icon: BookOpen, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Kursus" },
    enroll: { icon: BookOpen, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Enroll Kursus" },
    transaction: { icon: CreditCard, color: "text-orange-600", bgColor: "bg-orange-100", label: "Transaksi" },
    payment: { icon: CreditCard, color: "text-orange-600", bgColor: "bg-orange-100", label: "Pembayaran" },
    review: { icon: Star, color: "text-[#F4B400]", bgColor: "bg-[#F4B400]/10", label: "Review" },
    setting: { icon: Settings, color: "text-purple-600", bgColor: "bg-purple-100", label: "Pengaturan" },
    delete: { icon: Trash2, color: "text-[#D93025]", bgColor: "bg-[#D93025]/10", label: "Hapus" },
    update: { icon: Edit, color: "text-orange-600", bgColor: "bg-orange-100", label: "Update" },
    edit: { icon: Edit, color: "text-orange-600", bgColor: "bg-orange-100", label: "Edit" },
    view: { icon: Eye, color: "text-[#005EB8]", bgColor: "bg-[#005EB8]/10", label: "Lihat" },
    download: { icon: Download, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Download" },
    "certificate_download": { icon: Download, color: "text-[#008A00]", bgColor: "bg-[#008A00]/10", label: "Download Sertifikat" },
    "resend_verification": { icon: Settings, color: "text-purple-600", bgColor: "bg-purple-100", label: "Resend Verification" },
  };

  // Find matching config
  for (const [key, config] of Object.entries(configs)) {
    if (actionLower.includes(key)) {
      return config;
    }
  }

  // Default config
  return { 
    icon: Activity, 
    color: "text-gray-600", 
    bgColor: "bg-gray-100", 
    label: action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) 
  };
};

const parseUserAgent = (userAgent: string | null) => {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "MacOS";
  if (userAgent.includes("Linux")) return "Linux";
  return "Desktop";
};

const groupByDate = (logs: ActivityLog[]) => {
  const grouped: Record<string, ActivityLog[]> = {};
  logs.forEach((log) => {
    const date = formatDate(log.created_at);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });
  return grouped;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  const getAuthToken = useCallback(() => {
    return typeof window !== "undefined" 
      ? localStorage.getItem("token") || localStorage.getItem("accessToken") 
      : null;
  }, []);

  const fetchLogs = useCallback(async () => {
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

      if (actionFilter !== "all") params.append("action", actionFilter);

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data logs");
      const data = await response.json();
      
      setLogs(data.logs || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
      
      if (data.filters?.actions) {
        setAvailableActions(data.filters.actions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs locally by search term
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.ip_address?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Stats
  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.created_at).toDateString();
    return logDate === new Date().toDateString();
  }).length;

  const loginCount = logs.filter((log) => 
    log.action.toLowerCase().includes("login")
  ).length;

  const errorCount = logs.filter((log) => 
    log.action.toLowerCase().includes("error") || 
    log.action.toLowerCase().includes("fail")
  ).length;

  const groupedLogs = groupByDate(filteredLogs);

  const handleReset = () => {
    setSearchTerm("");
    setActionFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (loading && logs.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Activity className="h-8 w-8 text-[#005EB8]" />
                Activity Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Pantau semua aktivitas pengguna dalam sistem
              </p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {pagination.total} Aktivitas
            </Badge>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D93025]" />
                  <p className="text-[#D93025] dark:text-red-400">{error}</p>
                </div>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Clock className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <LogIn className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Login</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{loginCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <AlertCircle className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{errorCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari user, action, entity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <Select
                  value={actionFilter}
                  onValueChange={(v) => {
                    setActionFilter(v);
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8] dark:border-gray-600 dark:bg-gray-800 w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[200px]">
                    <SelectItem value="all">Semua Action</SelectItem>
                    {availableActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionConfig(action).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          {Object.keys(groupedLogs).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#005EB8]" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{date}</h3>
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none ml-auto md:ml-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                          {dayLogs.length} aktivitas
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Mobile/Tablet View - Cards */}
                  <div className="block lg:hidden space-y-4">
                    {dayLogs.map((log) => {
                      const config = getActionConfig(log.action);
                      const ActionIcon = config.icon;
                      
                      return (
                        <Card key={log.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                          <CardContent className="p-4">
                            {/* Header: User Name, Action Icon, Time */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
                                  <ActionIcon className={`h-5 w-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {log.user.full_name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatTime(log.created_at)}
                                </p>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{log.user.email}</p>
                            </div>

                            {/* Entity Badge */}
                            {log.entity_type && (
                              <div className="mb-3">
                                <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs">
                                  {log.entity_type}
                                  {log.entity_id && (
                                    <span className="text-gray-500 ml-1">
                                      #{log.entity_id.slice(0, 8)}
                                    </span>
                                  )}
                                </Badge>
                              </div>
                            )}

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              {log.ip_address && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {log.ip_address}
                                  </p>
                                </div>
                              )}
                              {log.user_agent && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Device</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    {parseUserAgent(log.user_agent)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop View - Timeline */}
                  <div className="hidden lg:block space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {dayLogs.map((log) => {
                      const config = getActionConfig(log.action);
                      const ActionIcon = config.icon;
                      
                      return (
                        <div key={log.id} className="relative">
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
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {log.user.full_name}
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {log.user.email}
                                      </span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {log.entity_type && (
                                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs">
                                          {log.entity_type}
                                          {log.entity_id && (
                                            <span className="text-gray-500 ml-1">
                                              #{log.entity_id.slice(0, 8)}
                                            </span>
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {log.ip_address && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {log.ip_address}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right flex-shrink-0 min-w-[100px]">
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {formatTime(log.created_at)}
                                  </p>
                                  {log.user_agent && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-end gap-1">
                                      <Monitor className="h-3 w-3" />
                                      {parseUserAgent(log.user_agent)}
                                    </p>
                                  )}
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
                      {searchTerm || actionFilter !== "all"
                        ? "Tidak ada log yang cocok"
                        : "Belum ada aktivitas"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || actionFilter !== "all"
                        ? "Coba ubah filter pencarian Anda"
                        : "Log aktivitas akan muncul di sini"}
                    </p>
                    {(searchTerm || actionFilter !== "all") && (
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}