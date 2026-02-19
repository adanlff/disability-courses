'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  UserX,
  UserCheck,
  MoreHorizontal,
  Users,
  UserMinus,
  Loader2,
  X,
  Trash2,
  AlertCircle,
  Shield,
  Filter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

// Client-side getCookie function
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'MENTOR' | 'STUDENT';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  disability_type: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  _count?: {
    enrollments: number;
    certificates: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all'); // Default 'all' instead of 'STUDENT'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed to 10 items per page
    total: 0,
    totalPages: 0,
  });

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = useCallback(() => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
      token = getCookieValue('accessToken');
    }
    return token;
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(), // Use dynamic limit
      });

      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesi telah berakhir. Silakan login kembali.');
        } else if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini.');
        } else {
          throw new Error('Gagal mengambil data pengguna');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.users) {
        setUsers(result.users);
        
        // Calculate stats
        const active = result.users.filter((u: User) => u.status === 'ACTIVE').length;
        const suspended = result.users.filter((u: User) => u.status === 'SUSPENDED').length;
        const inactive = result.users.filter((u: User) => u.status === 'INACTIVE').length;
        
        setStats({
          total: result.pagination?.total || result.users.length,
          active,
          suspended,
          inactive,
        });
        
        // Update pagination state
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || result.users.length,
          totalPages: result.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filterStatus, filterRole, searchTerm, pagination.limit]);

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [fetchUsers, pagination.page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">Aktif</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">Ditangguhkan</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Tidak Aktif</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">Admin</Badge>;
      case 'MENTOR':
        return <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">Mentor</Badge>;
      case 'STUDENT':
        return <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">Siswa</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal mengaktifkan pengguna');
      }

      fetchUsers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menangguhkan pengguna');
      }

      fetchUsers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menghapus pengguna');
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Filter users locally (if needed for search)
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Users className="h-8 w-8 text-[#005EB8]" />
                Kelola Pengguna
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manajemen akun pengguna (aktifkan, tangguhkan, hapus)
              </p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {stats.total} Pengguna
            </Badge>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D93025]" />
                  <p className="text-[#D93025] dark:text-[#D93025]">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-[#D93025] dark:text-[#D93025] hover:text-[#B71C1C] dark:hover:text-[#B71C1C]">
                  <X className="h-5 w-5" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengguna</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <UserCheck className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <UserMinus className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ditangguhkan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.suspended}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <UserX className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tidak Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5 text-[#005EB8]" />
                    Daftar Pengguna
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {pagination.total} pengguna ditemukan
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
                      placeholder="Cari nama atau email pengguna..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value) => {
                    setFilterStatus(value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}>
                    <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="SUSPENDED">Ditangguhkan</SelectItem>
                      <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterRole} onValueChange={(value) => {
                    setFilterRole(value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}>
                    <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="STUDENT">Siswa</SelectItem>
                      <SelectItem value="MENTOR">Mentor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table - Desktop / Cards - Mobile & Tablet */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <span className="text-gray-600 dark:text-gray-400">Memuat data pengguna...</span>
                </div>
              ) : users.length > 0 ? (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {users.map((user) => (
                      <Card key={user.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: Name, Role, Status, Action */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {user.full_name || '-'}
                              </p>
                              {user.disability_type && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {user.disability_type}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {getStatusBadge(user.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] dark:hover:bg-[#005EB8]/20 flex-shrink-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem className="text-[#005EB8] hover:text-[#004A93] dark:text-[#005EB8] dark:hover:text-[#004A93]">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Lihat Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.status === 'ACTIVE' ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleSuspendUser(user.id)}
                                      className="text-[#F4B400] hover:text-[#E6A800] dark:text-[#F4B400] dark:hover:text-[#E6A800]"
                                      disabled={isSubmitting}
                                    >
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Tangguhkan
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user.id)}
                                      className="text-[#008A00] hover:text-[#007800] dark:text-[#008A00] dark:hover:text-[#007800]"
                                      disabled={isSubmitting}
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Aktifkan
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(user.id)}
                                    className="text-[#D93025] hover:text-[#C02920] dark:text-[#D93025] dark:hover:text-[#C02920]"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{user.email}</p>
                            {user.email_verified && (
                              <span className="inline-flex items-center gap-1 text-xs text-[#008A00] dark:text-[#008A00] mt-1">
                                <Shield className="h-3 w-3" />
                                Terverifikasi
                              </span>
                            )}
                          </div>

                          {/* Role Badge */}
                          <div className="mb-3">
                            {getRoleBadge(user.role)}
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Bergabung</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Login Terakhir</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user.last_login)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user._count?.enrollments || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sertifikat</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user._count?.certificates || 0}</p>
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
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Nama</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Role</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Bergabung</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Login Terakhir</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Kursus</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Sertifikat</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <TableCell className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {user.full_name || '-'}
                                </p>
                                {user.disability_type && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {user.disability_type}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="text-sm">
                                <p className="text-gray-900 dark:text-white">{user.email}</p>
                                {user.email_verified && (
                                  <span className="inline-flex items-center gap-1 text-xs text-[#008A00] dark:text-[#008A00] mt-1">
                                    <Shield className="h-3 w-3" />
                                    Terverifikasi
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{getRoleBadge(user.role)}</TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(user.last_login)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user._count?.enrollments || 0}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user._count?.certificates || 0}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] dark:hover:bg-[#005EB8]/20"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem className="text-[#005EB8] hover:text-[#004A93] dark:text-[#005EB8] dark:hover:text-[#004A93]">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Lihat Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.status === 'ACTIVE' ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleSuspendUser(user.id)}
                                      className="text-[#F4B400] hover:text-[#E6A800] dark:text-[#F4B400] dark:hover:text-[#E6A800]"
                                      disabled={isSubmitting}
                                    >
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Tangguhkan
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user.id)}
                                      className="text-[#008A00] hover:text-[#007800] dark:text-[#008A00] dark:hover:text-[#007800]"
                                      disabled={isSubmitting}
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Aktifkan
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(user.id)}
                                    className="text-[#D93025] hover:text-[#C02920] dark:text-[#D93025] dark:hover:text-[#C02920]"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak ada pengguna ditemukan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                          setFilterRole('all');
                          setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        variant="outline"
                        className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] dark:hover:bg-[#005EB8]/20"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              loading={isLoading}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Hapus Pengguna</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait pengguna.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="bg-[#D93025] hover:bg-[#C02920] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Pengguna'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}