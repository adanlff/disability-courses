"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Star,
  CreditCard,
  UserPlus,
  Award,
  PieChart,
  Activity,
  Download,
  Layers,
  TrendingUp as TrendingUpIcon,
  Filter,
  Eye,
  CheckCircle,
  LineChart,
  Target,
  ShoppingBag,
  Bookmark,
  GraduationCap,
  Crown,
  BarChart,
  FileBarChart,
  ChartBar,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface RevenueReport {
  period: string;
  date_range: { from: string; to: string };
  summary: {
    total_revenue: number;
    total_discount: number;
    total_transactions: number;
    average_transaction: number;
  };
  trend: { date: string; revenue: number; transactions: number }[];
  by_payment_method: { method: string; amount: number }[];
  top_courses: { course_id: string; course_title: string; revenue: number; transactions: number }[];
}

interface UsersReport {
  period: string;
  summary: {
    total: number;
    active: number;
    suspended: number;
    new_in_period: number;
    active_in_period: number;
  };
  by_role: { role: string; count: number }[];
  registration_trend: { date: string; count: number }[];
  top_learners: { user: { id: string; full_name: string; email: string; avatar_url: string | null }; enrollments: number }[];
}

interface CoursesReport {
  period: string;
  summary: {
    total: number;
    published: number;
    pending: number;
    draft: number;
    new_in_period: number;
  };
  top_rated: { id: string; title: string; average_rating: number; total_reviews: number; mentor: { user: { full_name: string } } }[];
  most_enrolled: { id: string; title: string; total_students: number; price: number; is_free: boolean; mentor: { user: { full_name: string } } }[];
  by_category: { category: string; count: number }[];
  by_level: { level: string; count: number }[];
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
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = { BEGINNER: "Pemula", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan", ALL_LEVELS: "Semua Level" };
  return labels[level] || level;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = { E_WALLET: "E-Wallet", VIRTUAL_ACCOUNT: "Virtual Account", QRIS: "QRIS" };
  return labels[method] || method;
};

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"revenue" | "users" | "courses">("revenue");
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [usersReport, setUsersReport] = useState<UsersReport | null>(null);
  const [coursesReport, setCoursesReport] = useState<CoursesReport | null>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [revenueRes, usersRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/reports/revenue?period=${period}`, { headers }),
        fetch(`/api/admin/reports/users?period=${period}`, { headers }),
        fetch(`/api/admin/reports/courses?period=${period}`, { headers }),
      ]);

      if (revenueRes.ok) setRevenueReport(await revenueRes.json());
      if (usersRes.ok) setUsersReport(await usersRes.json());
      if (coursesRes.ok) setCoursesReport(await coursesRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const maxRevenue = revenueReport?.trend ? Math.max(...revenueReport.trend.map((t) => t.revenue), 1) : 1;
  const maxRegistration = usersReport?.registration_trend ? Math.max(...usersReport.registration_trend.map((t) => t.count), 1) : 1;

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <BarChart3 className="h-8 w-8 text-[#005EB8]" />
                Laporan & Analitik
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Pantau performa platform secara komprehensif</p>
            </div>
            <div className="flex justify-center md:justify-end gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">30 Hari Terakhir</SelectItem>
                  <SelectItem value="quarter">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="year">1 Tahun Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 md:gap-2 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setActiveTab("revenue")} 
              className={`flex-1 md:flex-none px-2 md:px-4 py-2 font-medium flex items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 transition-colors text-sm md:text-base ${
                activeTab === "revenue" 
                  ? "border-[#005EB8] text-[#005EB8]" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pendapatan</span>
            </button>
            <button 
              onClick={() => setActiveTab("users")} 
              className={`flex-1 md:flex-none px-2 md:px-4 py-2 font-medium flex items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 transition-colors text-sm md:text-base ${
                activeTab === "users" 
                  ? "border-[#005EB8] text-[#005EB8]" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pengguna</span>
            </button>
            <button 
              onClick={() => setActiveTab("courses")} 
              className={`flex-1 md:flex-none px-2 md:px-4 py-2 font-medium flex items-center justify-center md:justify-start gap-1 md:gap-2 border-b-2 transition-colors text-sm md:text-base ${
                activeTab === "courses" 
                  ? "border-[#005EB8] text-[#005EB8]" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Kursus</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
            </div>
          ) : error ? (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <Activity className="h-5 w-5" />
                  </div>
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Revenue Tab */}
              {activeTab === "revenue" && revenueReport && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#008A00]/10">
                            <DollarSign className="h-6 w-6 text-[#008A00]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatShortCurrency(revenueReport.summary.total_revenue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#005EB8]/10">
                            <CreditCard className="h-6 w-6 text-[#005EB8]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {revenueReport.summary.total_transactions}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#F4B400]/10">
                            <TrendingUpIcon className="h-6 w-6 text-[#F4B400]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatShortCurrency(revenueReport.summary.average_transaction)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#D93025]/10">
                            <TrendingDown className="h-6 w-6 text-[#D93025]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Diskon</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatShortCurrency(revenueReport.summary.total_discount)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts and Data */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <LineChart className="h-5 w-5 text-[#005EB8]" />
                          Trend Pendapatan
                        </CardTitle>
                        <CardDescription>Perkembangan pendapatan harian</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {revenueReport.trend.length === 0 ? (
                          <div className="text-center py-8">
                            <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data pendapatan</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-end gap-2 h-48">
                              {revenueReport.trend.slice(-14).map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                  <div 
                                    className="w-full bg-[#005EB8] rounded-t transition-all hover:bg-[#004A93] cursor-pointer" 
                                    style={{ 
                                      height: `${(day.revenue / maxRevenue) * 100}%`, 
                                      minHeight: day.revenue > 0 ? "4px" : "2px" 
                                    }} 
                                    title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                                  />
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(day.date)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatDate(revenueReport.trend[0]?.date)}</span>
                              <span>{formatDate(revenueReport.trend[revenueReport.trend.length - 1]?.date)}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <CreditCard className="h-5 w-5 text-[#005EB8]" />
                          Metode Pembayaran
                        </CardTitle>
                        <CardDescription>Distribusi berdasarkan metode pembayaran</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {revenueReport.by_payment_method.length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data pembayaran</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {revenueReport.by_payment_method.map((pm, i) => {
                              const total = revenueReport.by_payment_method.reduce((s, p) => s + p.amount, 0);
                              const pct = total > 0 ? (pm.amount / total) * 100 : 0;
                              return (
                                <div key={i}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {getPaymentMethodLabel(pm.method)}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(pm.amount)}</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#005EB8] rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{pm.amount > 0 ? formatShortCurrency(pm.amount) : 'Rp 0'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Courses by Revenue */}
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg md:text-xl font-bold">
                            <ShoppingBag className="h-5 w-5 text-[#008A00]" />
                            Kursus dengan Pendapatan Tertinggi
                          </CardTitle>
                          <CardDescription>Kursus dengan pendapatan terbesar</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat Semua
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {revenueReport.top_courses.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">Tidak ada data kursus</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {revenueReport.top_courses.slice(0, 5).map((course, i) => (
                            <div key={course.course_id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                i === 0 ? "bg-[#F4B400]" : 
                                i === 1 ? "bg-gray-500" : 
                                i === 2 ? "bg-[#D93025]" : "bg-gray-400"
                              }`}>
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{course.course_title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{course.transactions} transaksi</p>
                              </div>
                              <p className="font-bold text-[#008A00]">{formatCurrency(course.revenue)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && usersReport && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#005EB8]/10">
                            <Users className="h-6 w-6 text-[#005EB8]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total User</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{usersReport.summary.total}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#008A00]/10">
                            <Activity className="h-6 w-6 text-[#008A00]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aktif</p>
                            <p className="text-2xl font-bold text-[#008A00] dark:text-[#008A00]">{usersReport.summary.active}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#F4B400]/10">
                            <UserPlus className="h-6 w-6 text-[#F4B400]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Baru (Periode)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{usersReport.summary.new_in_period}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#D93025]/10">
                            <TrendingDown className="h-6 w-6 text-[#D93025]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Suspended</p>
                            <p className="text-2xl font-bold text-[#D93025] dark:text-[#D93025]">{usersReport.summary.suspended}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Registration Trend */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <TrendingUpIcon className="h-5 w-5 text-[#005EB8]" />
                          Trend Registrasi
                        </CardTitle>
                        <CardDescription>Pertumbuhan pengguna baru harian</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {usersReport.registration_trend.length === 0 ? (
                          <div className="text-center py-8">
                            <TrendingUpIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data registrasi</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-end gap-2 h-48">
                              {usersReport.registration_trend.slice(-14).map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                  <div 
                                    className="w-full bg-[#005EB8] rounded-t transition-all hover:bg-[#004A93] cursor-pointer" 
                                    style={{ 
                                      height: `${(day.count / maxRegistration) * 100}%`, 
                                      minHeight: day.count > 0 ? "4px" : "2px" 
                                    }} 
                                    title={`${formatDate(day.date)}: ${day.count} user`}
                                  />
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(day.date)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatDate(usersReport.registration_trend[0]?.date)}</span>
                              <span>{formatDate(usersReport.registration_trend[usersReport.registration_trend.length - 1]?.date)}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Users by Role */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <Filter className="h-5 w-5 text-[#005EB8]" />
                          Distribusi Role
                        </CardTitle>
                        <CardDescription>Distribusi pengguna berdasarkan role</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {usersReport.by_role.length === 0 ? (
                          <div className="text-center py-8">
                            <Filter className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data role</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {usersReport.by_role.map((role) => {
                              const total = usersReport.by_role.reduce((s, r) => s + r.count, 0);
                              const pct = total > 0 ? (role.count / total) * 100 : 0;
                              const colors: Record<string, string> = { 
                                ADMIN: "bg-[#D93025]", 
                                MENTOR: "bg-[#005EB8]", 
                                STUDENT: "bg-[#008A00]" 
                              };
                              return (
                                <div key={role.role}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                      <span className={`w-3 h-3 rounded-full ${colors[role.role] || "bg-gray-500"}`} />
                                      {role.role}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{role.count} user</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${colors[role.role] || "bg-gray-500"} rounded-full`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{role.count} dari {total}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Learners */}
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg md:text-xl font-bold">
                            <Crown className="h-5 w-5 text-[#F4B400]" />
                            Top Learners
                          </CardTitle>
                          <CardDescription>Pengguna dengan enrollment terbanyak</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat Semua
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {usersReport.top_learners.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">Tidak ada data learners</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {usersReport.top_learners.slice(0, 10).map((learner, i) => (
                            <div key={learner.user?.id || i} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                i === 0 ? "bg-[#F4B400]" : 
                                i === 1 ? "bg-gray-500" : 
                                i === 2 ? "bg-[#D93025]" : "bg-gray-400"
                              }`}>
                                {i + 1}
                              </div>
                              {learner.user?.avatar_url ? (
                                <img 
                                  src={learner.user.avatar_url} 
                                  alt={learner.user?.full_name || "User"} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-medium">
                                  {learner.user?.full_name?.charAt(0) || "?"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{learner.user?.full_name || "Unknown"}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{learner.user?.email}</p>
                              </div>
                              <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">{learner.enrollments} kursus</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === "courses" && coursesReport && (
                <div className="space-y-6">
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
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{coursesReport.summary.total}</p>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{coursesReport.summary.published}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#F4B400]/10">
                            <Layers className="h-6 w-6 text-[#F4B400]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{coursesReport.summary.pending}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-[#D93025]/10">
                            <PieChart className="h-6 w-6 text-[#D93025]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{coursesReport.summary.draft}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Top Rated */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3 border-b">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                            <Star className="h-5 w-5 text-[#F4B400]" />
                            Rating Tertinggi
                          </CardTitle>
                          <CardDescription>Kursus dengan rating terbaik</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {coursesReport.top_rated.length === 0 ? (
                          <div className="text-center py-8">
                            <Star className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data rating</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {coursesReport.top_rated.slice(0, 5).map((course, i) => (
                              <div key={course.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  i === 0 ? "bg-[#F4B400]" : 
                                  i === 1 ? "bg-gray-500" : 
                                  i === 2 ? "bg-[#D93025]" : "bg-gray-400"
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Oleh {course.mentor?.user?.full_name}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400]" />
                                    <p className="font-bold text-gray-900 dark:text-white">{course.average_rating.toFixed(1)}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.total_reviews} review</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Most Enrolled */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3 border-b">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                            <Users className="h-5 w-5 text-[#005EB8]" />
                            Paling Populer
                          </CardTitle>
                          <CardDescription>Kursus dengan siswa terbanyak</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {coursesReport.most_enrolled.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data enroll</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {coursesReport.most_enrolled.slice(0, 5).map((course, i) => (
                              <div key={course.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  i === 0 ? "bg-[#F4B400]" : 
                                  i === 1 ? "bg-gray-500" : 
                                  i === 2 ? "bg-[#D93025]" : "bg-gray-400"
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Oleh {course.mentor?.user?.full_name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-white">{course.total_students}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">siswa</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* By Category */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <Bookmark className="h-5 w-5 text-[#005EB8]" />
                          Per Kategori
                        </CardTitle>
                        <CardDescription>Distribusi kursus berdasarkan kategori</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {coursesReport.by_category.length === 0 ? (
                          <div className="text-center py-8">
                            <Filter className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data kategori</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {coursesReport.by_category.map((cat) => {
                              const total = coursesReport.by_category.reduce((s, c) => s + c.count, 0);
                              const pct = total > 0 ? (cat.count / total) * 100 : 0;
                              return (
                                <div key={cat.category}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.category}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{cat.count} kursus</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#005EB8] rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{cat.count} dari {total}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* By Level */}
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                          <GraduationCap className="h-5 w-5 text-[#005EB8]" />
                          Per Level
                        </CardTitle>
                        <CardDescription>Distribusi kursus berdasarkan level kesulitan</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {coursesReport.by_level.length === 0 ? (
                          <div className="text-center py-8">
                            <Layers className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data level</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {coursesReport.by_level.map((level) => {
                              const total = coursesReport.by_level.reduce((s, l) => s + l.count, 0);
                              const pct = total > 0 ? (level.count / total) * 100 : 0;
                              const colors: Record<string, string> = { 
                                BEGINNER: "bg-[#008A00]", 
                                INTERMEDIATE: "bg-[#005EB8]", 
                                ADVANCED: "bg-[#D93025]", 
                                ALL_LEVELS: "bg-gray-500" 
                              };
                              return (
                                <div key={level.level}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{getLevelLabel(level.level)}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{level.count} kursus</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${colors[level.level] || "bg-gray-500"} rounded-full`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{level.count} dari {total}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}