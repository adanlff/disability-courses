'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  Download,
  MoreHorizontal,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

interface Transaction {
  id: string;
  order_id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    mentor?: {
      user?: {
        full_name: string;
      };
    };
  };
  amount: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    expired: 0,
    totalRevenue: 0
  });

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (filterStatus !== 'all') {
        params.set('status', filterStatus.toUpperCase());
      }

      const response = await fetch(`/api/admin/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { page: 1, limit: pagination.limit, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, filterStatus]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      
      // Fetch all transactions for stats calculation
      const response = await fetch('/api/admin/transactions?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const allTransactions = data.transactions || [];
        
        const total = allTransactions.length;
        const success = allTransactions.filter((t: Transaction) => t.status === 'SUCCESS').length;
        const pending = allTransactions.filter((t: Transaction) => t.status === 'PENDING').length;
        const failed = allTransactions.filter((t: Transaction) => t.status === 'FAILED').length;
        const expired = allTransactions.filter((t: Transaction) => t.status === 'EXPIRED').length;
        const totalRevenue = allTransactions
          .filter((t: Transaction) => t.status === 'SUCCESS')
          .reduce((sum: number, t: Transaction) => sum + (t.total_amount || 0), 0);

        setStats({ total, success, pending, failed, expired, totalRevenue });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [fetchTransactions, fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none text-xs px-3 py-1.5">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            Berhasil
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs px-3 py-1.5">
            <Clock className="h-3 w-3 mr-1.5" />
            Pending
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none text-xs px-3 py-1.5">
            <XCircle className="h-3 w-3 mr-1.5" />
            Gagal
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs px-3 py-1.5">
            <Clock className="h-3 w-3 mr-1.5" />
            Kadaluarsa
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs px-3 py-1.5">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'BANK_TRANSFER': 'Transfer Bank',
      'CREDIT_CARD': 'Kartu Kredit',
      'E_WALLET': 'E-Wallet',
      'CASH': 'Tunai'
    };
    return methods[method] || method;
  };

  // Filter transactions by search term
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      (transaction.order_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.user?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.course?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleRefresh = () => {
    fetchTransactions();
    fetchStats();
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
              <CreditCard className="h-8 w-8 text-[#005EB8]" />
              Transaksi
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Daftar semua transaksi pembelian kursus
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#005EB8]/10">
                  <CreditCard className="h-6 w-6 text-[#005EB8]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                  <XCircle className="h-6 w-6 text-[#D93025]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gagal</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed + stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#008A00]/10">
                  <CreditCard className="h-6 w-6 text-[#008A00]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pendapatan</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-[#005EB8]" />
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
                    placeholder="Cari ID transaksi, user, atau kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}>
                  <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="SUCCESS">Berhasil</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                    <SelectItem value="EXPIRED">Kadaluarsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table - Desktop / Cards - Mobile & Tablet */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Memuat transaksi...</p>
                </div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
                {/* Mobile & Tablet View - Cards */}
                <div className="block lg:hidden p-4 space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <Card key={transaction.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                      <CardContent className="p-4">
                        {/* Header: Order ID & Status */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="font-mono text-xs text-gray-600 dark:text-gray-400" title={transaction.order_id}>
                            {transaction.order_id}
                          </div>
                          {getStatusBadge(transaction.status)}
                        </div>

                        {/* User Info */}
                        <div className="mb-3">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {transaction.user?.full_name || '-'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.user?.email || '-'}
                          </p>
                        </div>

                        {/* Course */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {transaction.course?.title || '-'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.course?.mentor?.user?.full_name || 'Mentor'}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Metode</p>
                            <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs px-2 py-0.5 mt-0.5">
                              {getPaymentMethodLabel(transaction.payment_method)}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-lg font-bold text-[#005EB8]">
                              {formatCurrency(transaction.total_amount).replace('Rp', 'Rp ')}
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
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3">
                        Order ID
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 min-w-[180px]">
                        User
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
                        Jumlah
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
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
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={transaction.user?.full_name || '-'}>
                              {transaction.user?.full_name || '-'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={transaction.user?.email || '-'}>
                              {transaction.user?.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white text-sm max-w-[200px] truncate" title={transaction.course?.title || '-'}>
                            {transaction.course?.title || '-'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {transaction.course?.mentor?.user?.full_name || 'Mentor'}
                          </p>
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
                            {getStatusBadge(transaction.status)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <CreditCard className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterStatus !== 'all' ? 'Tidak ada transaksi' : 'Belum ada transaksi'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Coba ubah filter pencarian Anda' 
                        : 'Belum ada transaksi yang tercatat'}
                    </p>
                  </div>
                </div>
              </div>
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
    </AdminLayout>
    </ProtectedRoute>
  );
}