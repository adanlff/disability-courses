"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  BookOpen,
  Filter,
  DollarSign,
  Eye,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";
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

type TransactionStatus = "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  mentor: {
    user: {
      full_name: string;
    };
  } | null;
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
  course: Course;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusConfig = (status: TransactionStatus) => {
  const configs = {
    PENDING: {
      label: "Menunggu",
      icon: Clock,
      color: "bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none",
      iconColor: "text-[#F4B400]",
    },
    PAID: {
      label: "Dibayar",
      icon: CheckCircle2,
      color: "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none",
      iconColor: "text-[#008A00]",
    },
    SUCCESS: {
      label: "Berhasil",
      icon: CheckCircle2,
      color: "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none",
      iconColor: "text-[#008A00]",
    },
    FAILED: {
      label: "Gagal",
      icon: XCircle,
      color: "bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none",
      iconColor: "text-[#D93025]",
    },
    CANCELLED: {
      label: "Dibatalkan",
      icon: XCircle,
      color: "bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
      iconColor: "text-gray-500",
    },
    REFUNDED: {
      label: "Refund",
      icon: AlertCircle,
      color: "bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
      iconColor: "text-gray-500",
    },
  };
  return configs[status] || configs.PENDING;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    MIDTRANS: "Midtrans",
    E_WALLET: "E-Wallet",
    VIRTUAL_ACCOUNT: "VA",
    QRIS: "QRIS",
    BANK_TRANSFER: "Transfer",
  };
  return labels[method] || method;
};

export default function UserTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          return;
        }

        const response = await fetch(`/api/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Gagal mengambil data transaksi");

        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [getAuthToken]);

  const filteredTransactions = transactions
    .filter((tx) => {
      const matchesSearch =
        tx.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "amount-high") return b.total_amount - a.total_amount;
      if (sortBy === "amount-low") return a.total_amount - b.total_amount;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === "SUCCESS" || t.status === "PAID").length,
    pending: transactions.filter((t) => t.status === "PENDING").length,
    totalSpent: transactions
      .filter((t) => t.status === "SUCCESS" || t.status === "PAID")
      .reduce((sum, t) => sum + t.total_amount, 0),
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat transaksi...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Receipt className="h-8 w-8 text-[#005EB8]" />
                Riwayat Transaksi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat semua transaksi pembelian kursus Anda
              </p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[#D93025]" />
                <p className="text-[#D93025] dark:text-[#D93025]">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Receipt className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle2 className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Berhasil</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.success}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <DollarSign className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Belanja</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalSpent).replace('Rp', 'Rp ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Receipt className="h-5 w-5 text-[#005EB8]" />
                    Daftar Transaksi
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {filteredTransactions.length} transaksi ditemukan
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
                      type="search" 
                      placeholder="Cari order ID atau nama kursus..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="PENDING">Menunggu</SelectItem>
                      <SelectItem value="SUCCESS">Berhasil</SelectItem>
                      <SelectItem value="PAID">Dibayar</SelectItem>
                      <SelectItem value="FAILED">Gagal</SelectItem>
                      <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                      <SelectItem value="amount-high">Nominal ↓</SelectItem>
                      <SelectItem value="amount-low">Nominal ↑</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredTransactions.length > 0 ? (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {filteredTransactions.map((transaction) => {
                      const statusConfig = getStatusConfig(transaction.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <Card key={transaction.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                          <CardContent className="p-4">
                            {/* Header: Order ID & Status */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="font-mono text-xs text-gray-600 dark:text-gray-400" title={transaction.order_id}>
                                {transaction.order_id}
                              </div>
                              <Badge className={`${statusConfig.color} text-xs px-2 py-1`}>
                                <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.iconColor}`} />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            {/* Course Info */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-9 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                {transaction.course.thumbnail ? (
                                  <img 
                                    src={transaction.course.thumbnail} 
                                    alt={transaction.course.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {transaction.course.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {transaction.course.mentor?.user?.full_name || "Instruktur"}
                                </p>
                              </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(transaction.created_at)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Metode</p>
                                <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs px-2 py-0.5 mt-0.5">
                                  {getPaymentMethodLabel(transaction.payment_method)}
                                </Badge>
                              </div>
                            </div>

                            {/* Total */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                              <p className="text-lg font-bold text-[#005EB8]">
                                {formatCurrency(transaction.total_amount).replace('Rp', 'Rp ')}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <Link href={`/user/transaction/${transaction.id}`} className="flex-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full h-8 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detail
                                </Button>
                              </Link>
                              {transaction.status === "PENDING" && transaction.payment_url && (
                                <a href={transaction.payment_url} target="_blank" rel="noopener noreferrer">
                                  <Button 
                                    size="sm" 
                                    className="h-8 bg-[#005EB8] hover:bg-[#004A93] text-white text-xs px-3"
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Bayar
                                  </Button>
                                </a>
                              )}
                              {(transaction.status === "SUCCESS" || transaction.status === "PAID") && (
                                <Link href={`/user/courses/${transaction.course.id}/player`}>
                                  <Button 
                                    size="sm" 
                                    className="h-8 bg-[#005EB8] hover:bg-[#004A93] text-white text-xs px-3"
                                  >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    Akses
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3">
                          Order ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 min-w-[180px]">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[110px] px-4 py-3">
                          Tanggal
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3">
                          Metode
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-right">
                          Total
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[130px] px-4 py-3 text-center">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const statusConfig = getStatusConfig(transaction.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <TableRow 
                            key={transaction.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <TableCell className="px-4 py-3">
                              <div className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate" title={transaction.order_id}>
                                {transaction.order_id}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-9 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                  {transaction.course.thumbnail ? (
                                    <img 
                                      src={transaction.course.thumbnail} 
                                      alt={transaction.course.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={transaction.course.title}>
                                    {transaction.course.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={transaction.course.mentor?.user?.full_name || "Instruktur"}>
                                    {transaction.course.mentor?.user?.full_name || "Instruktur"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex justify-start">
                                <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs px-2 py-1">
                                  {getPaymentMethodLabel(transaction.payment_method)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right font-semibold text-[#005EB8] whitespace-nowrap">
                              {formatCurrency(transaction.total_amount).replace('Rp', 'Rp ')}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex justify-center">
                                <Badge className={`${statusConfig.color} text-xs px-3 py-1.5`}>
                                  <StatusIcon className={`h-3 w-3 mr-1.5 ${statusConfig.iconColor}`} />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* Button Ikon Mata - Style diubah seperti button Lihat Semua di dashboard */}
                                <Link href={`/user/transaction/${transaction.id}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {transaction.status === "PENDING" && transaction.payment_url && (
                                  <a href={transaction.payment_url} target="_blank" rel="noopener noreferrer">
                                    <Button 
                                      size="sm" 
                                      className="h-8 bg-[#005EB8] hover:bg-[#004A93] text-white text-xs px-3"
                                    >
                                      <CreditCard className="h-3 w-3 mr-1.5" />
                                      Bayar
                                    </Button>
                                  </a>
                                )}
                                {/* Button Akses - Style diubah seperti button Lanjut Belajar di dashboard */}
                                {(transaction.status === "SUCCESS" || transaction.status === "PAID") && (
                                  <Link href={`/user/courses/${transaction.course.id}/player`}>
                                    <Button 
                                      size="sm" 
                                      className="h-8 bg-[#005EB8] hover:bg-[#004A93] text-white text-xs px-3"
                                    >
                                      <BookOpen className="h-3 w-3 mr-1.5" />
                                      Akses
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                </Table>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Receipt className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {searchTerm || filterStatus !== "all" ? "Tidak ada transaksi" : "Belum ada transaksi"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm || filterStatus !== "all" 
                          ? "Coba ubah filter pencarian Anda" 
                          : "Mulai belajar dengan membeli kursus"}
                      </p>
                    </div>
                    {!searchTerm && filterStatus === "all" && (
                      <Link href="/courses">
                        <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Jelajahi Kursus
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}