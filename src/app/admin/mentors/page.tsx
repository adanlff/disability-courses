'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Eye,
  UserCheck,
  UserX,
  MoreHorizontal,
  Users,
  Star,
  BookOpen,
  Clock,
  Loader2,
  X,
  Filter,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import MentorDetailModal from '@/components/modal/modal-mentor-detail';
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

interface MentorProfile {
  id: string;
  expertise: string[];
  experience: number;
  education: string | null;
  bio: string | null;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  portfolio: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_revenue: number;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone?: string | null;
  };
  _count?: {
    courses: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMentors() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed to 10 items per page
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [mentorToReject, setMentorToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = useCallback(() => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
      token = getCookieValue('accessToken');
    }
    return token;
  }, []);

  // Fetch mentors
  const fetchMentors = useCallback(async (page: number = 1) => {
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
        limit: pagination.limit.toString(),
      });

      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/mentors?${params}`, {
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
          throw new Error('Gagal mengambil data mentor');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.mentors) {
        setMentors(result.mentors);
        
        // Calculate stats
        const approved = result.mentors.filter((m: MentorProfile) => m.status === 'APPROVED').length;
        const pending = result.mentors.filter((m: MentorProfile) => m.status === 'PENDING').length;
        const rejected = result.mentors.filter((m: MentorProfile) => m.status === 'REJECTED').length;
        
        setStats({
          total: result.pagination?.total || result.mentors.length,
          approved,
          pending,
          rejected,
        });
        
        // Update pagination state
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || result.mentors.length,
          totalPages: result.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filterStatus, searchTerm, pagination.limit]);

  useEffect(() => {
    fetchMentors(pagination.page);
  }, [fetchMentors, pagination.page]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">Terverifikasi</Badge>;
      case 'PENDING':
        return <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">Menunggu</Badge>;
      case 'REJECTED':
        return <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none">Ditolak</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const handleViewDetail = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setIsDetailModalOpen(true);
  };

  const handleApproveMentor = async (mentorId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/mentors/${mentorId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menyetujui mentor');
      }

      setIsDetailModalOpen(false);
      fetchMentors(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectDialog = (mentorId: string) => {
    setMentorToReject(mentorId);
    setRejectReason('');
    setRejectDialogOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleRejectMentor = async () => {
    if (!mentorToReject || rejectReason.trim().length < 10) {
      setError('Alasan penolakan harus minimal 10 karakter');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/mentors/${mentorToReject}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menolak mentor');
      }

      setRejectDialogOpen(false);
      setMentorToReject(null);
      setRejectReason('');
      fetchMentors(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
                Kelola Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verifikasi dan manajemen akun mentor
              </p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {stats.total} Mentor
            </Badge>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D93025]" />
                  <p className="text-[#D93025] dark:text-red-400">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-[#D93025] dark:text-red-400 hover:text-[#B71C1C] dark:hover:text-red-300">
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Mentor</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Terverifikasi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <UserX className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ditolak</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mentors Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5 text-[#005EB8]" />
                    Daftar Mentor
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {pagination.total} mentor ditemukan
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
                      placeholder="Cari nama, email, atau keahlian mentor..."
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
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="APPROVED">Terverifikasi</SelectItem>
                      <SelectItem value="PENDING">Menunggu</SelectItem>
                      <SelectItem value="REJECTED">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <span className="text-gray-600 dark:text-gray-400">Memuat data mentor...</span>
                </div>
              ) : mentors.length > 0 ? (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {mentors.map((mentor) => (
                      <Card key={mentor.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {mentor.user?.full_name || '-'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {mentor.user?.email || '-'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {getStatusBadge(mentor.status)}
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {mentor._count?.courses || mentor.total_courses || 0}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatNumber(mentor.total_students || 0)}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400]" />
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {mentor.average_rating > 0 ? mentor.average_rating.toFixed(1) : '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetail(mentor)}
                              className="flex-1 h-8 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                            {mentor.status === 'PENDING' && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => handleApproveMentor(mentor.id)}
                                  className="h-8 px-3 bg-[#008A00] hover:bg-[#007000] text-white"
                                  disabled={isSubmitting}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => openRejectDialog(mentor.id)}
                                  className="h-8 px-3 bg-[#D93025] hover:bg-[#C02920] text-white"
                                  disabled={isSubmitting}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[180px] px-4 py-3">
                          Mentor
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[220px] px-4 py-3">
                          Email
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Siswa
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Rating
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mentors.map((mentor) => (
                        <TableRow key={mentor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate" title={mentor.user?.full_name || '-'}>
                                {mentor.user?.full_name || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={mentor.user?.email || '-'}>
                                {mentor.user?.email || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {mentor._count?.courses || mentor.total_courses || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(mentor.total_students || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-center">
                              <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400] flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {mentor.average_rating > 0 ? mentor.average_rating.toFixed(1) : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              {getStatusBadge(mentor.status)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetail(mentor)}
                                className="h-8 px-3 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {mentor.status === 'PENDING' && (
                                <>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleApproveMentor(mentor.id)}
                                    className="h-8 px-3 bg-[#008A00] hover:bg-[#007000] text-white"
                                    disabled={isSubmitting}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => openRejectDialog(mentor.id)}
                                    className="h-8 px-3 bg-[#D93025] hover:bg-[#C02920] text-white"
                                    disabled={isSubmitting}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
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
                        Tidak ada mentor ditemukan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
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

          {/* Mentor Detail Modal */}
          <MentorDetailModal
            mentor={selectedMentor}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onApprove={handleApproveMentor}
            onReject={openRejectDialog}
            isSubmitting={isSubmitting}
          />

          {/* Reject Dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent className="border rounded-lg bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Tolak Aplikasi Mentor</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Berikan alasan penolakan yang jelas untuk membantu mentor memperbaiki aplikasinya.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Alasan penolakan (minimal 10 karakter)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {rejectReason.length}/10 karakter minimum
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleRejectMentor}
                  disabled={isSubmitting || rejectReason.trim().length < 10}
                  className="bg-[#D93025] hover:bg-[#C02920] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Tolak'
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