"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Loader2,
  BookOpen,
  User,
  Mail,
  ExternalLink,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

type TransactionStatus = "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  discount_price: number | null;
  level: string;
  total_duration: number;
  mentor: { user: { full_name: string } } | null;
  category: { name: string } | null;
}

interface TransactionUser {
  id: string;
  full_name: string;
  email: string;
}

interface Transaction {
  id: string;
  order_id: string;
  course_id: string;
  amount: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  status: TransactionStatus;
  payment_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  course: Course;
  user: TransactionUser;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatDuration = (minutes: number) => { if (!minutes) return "0m"; if (minutes < 60) return `${minutes}m`; return `${Math.floor(minutes / 60)}j ${minutes % 60}m`; };
const getLevelLabel = (level: string) => ({ BEGINNER: "Pemula", INTERMEDIATE: "Menengah", ADVANCED: "Mahir", ALL_LEVELS: "Semua Level" }[level] || level);

const getStatusConfig = (status: TransactionStatus) => {
  const configs = {
    PENDING: { 
      label: "Menunggu Pembayaran", 
      icon: Clock, 
      color: "text-[#F4B400]", 
      bgColor: "bg-[#F4B400]/10",
      borderColor: "border-[#F4B400]/20",
      badgeClass: "bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20"
    },
    PAID: { 
      label: "Dibayar", 
      icon: CheckCircle2, 
      color: "text-[#008A00]", 
      bgColor: "bg-[#008A00]/10",
      borderColor: "border-[#008A00]/20",
      badgeClass: "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20"
    },
    SUCCESS: { 
      label: "Berhasil", 
      icon: CheckCircle2, 
      color: "text-[#008A00]", 
      bgColor: "bg-[#008A00]/10",
      borderColor: "border-[#008A00]/20",
      badgeClass: "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20"
    },
    FAILED: { 
      label: "Gagal", 
      icon: XCircle, 
      color: "text-[#D93025]", 
      bgColor: "bg-[#D93025]/10",
      borderColor: "border-[#D93025]/20",
      badgeClass: "bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20"
    },
    CANCELLED: { 
      label: "Dibatalkan", 
      icon: XCircle, 
      color: "text-gray-600", 
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      badgeClass: "bg-gray-100 text-gray-600 border border-gray-200"
    },
    REFUNDED: { 
      label: "Dikembalikan", 
      icon: AlertCircle, 
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      badgeClass: "bg-purple-100 text-purple-600 border border-purple-200"
    },
  };
  return configs[status] || configs.PENDING;
};

const getPaymentMethodLabel = (method: string) => ({ MIDTRANS: "Midtrans", E_WALLET: "E-Wallet", VIRTUAL_ACCOUNT: "Virtual Account", QRIS: "QRIS", BANK_TRANSFER: "Transfer Bank" }[method] || method);

export default function TransactionDetail() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchTransaction = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) { setError("Silakan login terlebih dahulu"); return; }
      const response = await fetch(`/api/payments/${transactionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { if (response.status === 404) { setError("Transaksi tidak ditemukan"); return; } throw new Error("Gagal mengambil detail transaksi"); }
      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [transactionId, getAuthToken]);

  useEffect(() => { fetchTransaction(); }, [fetchTransaction]);
  
  const handleRefresh = async () => { 
    setRefreshing(true); 
    await fetchTransaction(); 
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Memuat detail transaksi...</p>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  if (error || !transaction) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Receipt className="h-8 w-8 text-[#005EB8]" />
                Detail Transaksi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Informasi lengkap transaksi Anda</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Button 
              variant="outline" 
              asChild
              className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
            >
              <Link href="/user/transaction">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
            </div>
          </div>

          {/* Error Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-[#D93025]/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-[#D93025]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {error || "Transaksi tidak ditemukan"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Transaksi yang Anda cari tidak dapat ditemukan atau mungkin sudah dihapus.
                  </p>
                </div>
                <Link href="/user/transaction">
                  <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Riwayat Transaksi
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;
  const isPaid = transaction.status === "SUCCESS" || transaction.status === "PAID";
  const isPending = transaction.status === "PENDING";

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/user/transaction">
              <Button 
                variant="outline" 
                size="icon"
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-3">
                <Receipt className="h-8 w-8 text-[#005EB8]" />
                Detail Transaksi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Informasi lengkap transaksi Anda</p>
            </div>
          </div>

          {/* Status Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${statusConfig.bgColor}`}>
                    <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status Transaksi</p>
                    <Badge className={`${statusConfig.badgeClass} pointer-events-none text-base px-4 py-1`}>
                      {statusConfig.label}
                    </Badge>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">
                      ID: {transaction.order_id}
                    </p>
                    {isPending && transaction.expired_at && (
                      <p className="text-sm text-[#F4B400] mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Kedaluwarsa: {formatDate(transaction.expired_at)}
                      </p>
                    )}
                    {isPaid && transaction.paid_at && (
                      <p className="text-sm text-[#008A00] mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Dibayar: {formatDate(transaction.paid_at)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isPending && transaction.payment_url && (
                    <a href={transaction.payment_url} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Bayar Sekarang
                      </Button>
                    </a>
                  )}
                  {isPaid && (
                    <Link href={`/user/courses/${transaction.course.id}/player`}>
                      <Button size="lg" className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Akses Kursus
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Course & Payment Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Info Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                    Informasi Kursus
                  </CardTitle>
                  <CardDescription>Detail kursus yang dibeli</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {transaction.course.thumbnail ? (
                        <img 
                          src={transaction.course.thumbnail} 
                          alt={transaction.course.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{transaction.course.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {transaction.course.mentor?.user?.full_name || "Instruktur"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {transaction.course.category && (
                          <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                            {transaction.course.category.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-[#F4B400] text-[#F4B400]">
                          {getLevelLabel(transaction.course.level)}
                        </Badge>
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(transaction.course.total_duration)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href={`/courses/${transaction.course.slug || transaction.course.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat Detail Kursus
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <CreditCard className="h-5 w-5 text-[#005EB8]" />
                    Detail Pembayaran
                  </CardTitle>
                  <CardDescription>Rincian pembayaran transaksi</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-sm">{transaction.order_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Metode Pembayaran</span>
                      <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                        {getPaymentMethodLabel(transaction.payment_method)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Tanggal Transaksi</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Harga Kursus</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount).replace('IDR', 'Rp')}
                      </span>
                    </div>
                    {transaction.discount > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Diskon</span>
                        <span className="font-medium text-[#008A00]">
                          -{formatCurrency(transaction.discount).replace('IDR', 'Rp')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-4 mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 -mx-4">
                      <span className="font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                      <span className="font-bold text-[#005EB8] text-xl">
                        {formatCurrency(transaction.total_amount).replace('IDR', 'Rp')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Buyer Info Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <User className="h-5 w-5 text-[#005EB8]" />
                    Informasi Pembeli
                  </CardTitle>
                  <CardDescription>Data pembeli transaksi</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Nama</span>
                      <span className="font-medium text-gray-900 dark:text-white">{transaction.user.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-gray-400">Email</span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{transaction.user.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Calendar className="h-5 w-5 text-[#005EB8]" />
                    Timeline
                  </CardTitle>
                  <CardDescription>Riwayat aktivitas transaksi</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div className="space-y-4">
                      {/* Created */}
                      <div className="flex items-start gap-4 relative">
                        <div className="w-3 h-3 rounded-full bg-[#008A00] flex-shrink-0 mt-1.5 z-10"></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">Transaksi Dibuat</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      
                      {/* Paid */}
                      {isPaid && transaction.paid_at && (
                        <div className="flex items-start gap-4 relative">
                          <div className="w-3 h-3 rounded-full bg-[#008A00] flex-shrink-0 mt-1.5 z-10"></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Pembayaran Berhasil</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.paid_at)}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Pending */}
                      {isPending && (
                        <div className="flex items-start gap-4 relative">
                          <div className="w-3 h-3 rounded-full bg-[#F4B400] animate-pulse flex-shrink-0 mt-1.5 z-10"></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Menunggu Pembayaran</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Silakan selesaikan pembayaran</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Failed/Cancelled */}
                      {(transaction.status === "FAILED" || transaction.status === "CANCELLED") && (
                        <div className="flex items-start gap-4 relative">
                          <div className="w-3 h-3 rounded-full bg-[#D93025] flex-shrink-0 mt-1.5 z-10"></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {transaction.status === "FAILED" ? "Pembayaran Gagal" : "Transaksi Dibatalkan"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.updated_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Action Card with Gradient */}
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
                    <ChevronRight className="h-4 w-4 ml-2" />
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