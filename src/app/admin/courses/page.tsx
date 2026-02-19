'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  BookOpen,
  Loader2,
  Clock,
  Archive,
  Star,
  Filter,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
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
import { Textarea } from '@/components/ui/textarea';
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  price: number;
  is_free: boolean;
  average_rating: number;
  total_students: number;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  mentor: {
    id: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  _count?: {
    enrollments: number;
    reviews: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_REVIEW');
  const [filterCategory, setFilterCategory] = useState('all');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed to 10 items per page
    total: 0,
    totalPages: 0,
  });

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });

  // Reject states
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [courseToReject, setCourseToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete states
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add status filter
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/courses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kursus');
      }

      const result = await response.json();
      
      setCourses(result.courses || result.data || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || (result.courses?.length || result.data?.length || 0),
        totalPages: result.pagination?.totalPages || 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, filterStatus, pagination.limit]);

  useEffect(() => {
    fetchCourses(pagination.page);
  }, [fetchCourses, pagination.page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">Published</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">Menunggu Review</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Archived</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.mentor.user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || course.category?.name === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Approve course
  const handleApproveCourse = async (courseId: string) => {
    try {
      setActionLoading(courseId);
      const token = getAuthToken();
      
      const response = await fetch(`/api/admin/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menyetujui kursus');
      }

      // Update local state
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, status: 'PUBLISHED' as CourseStatus } : c
      ));

      // Show success message
      const course = courses.find(c => c.id === courseId);
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${course?.title}" telah disetujui dan dipublikasikan.`
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Open reject dialog
  const openRejectDialog = (courseId: string) => {
    setCourseToReject(courseId);
    setRejectReason('');
    setShowRejectAlert(true);
  };

  // Reject course
  const handleRejectCourse = async () => {
    if (!courseToReject) return;

    try {
      setActionLoading(courseToReject);
      const token = getAuthToken();
      
      const response = await fetch(`/api/admin/courses/${courseToReject}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error('Gagal menolak kursus');
      }

      // Update local state - move back to DRAFT
      setCourses(prev => prev.map(c => 
        c.id === courseToReject ? { ...c, status: 'DRAFT' as CourseStatus } : c
      ));
      
      // Show success message
      const course = courses.find(c => c.id === courseToReject);
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${course?.title}" telah ditolak dan dikembalikan ke status Draft.`
      });
      setShowAlert(true);

      setShowRejectAlert(false);
      setCourseToReject(null);
      setRejectReason('');
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteAlert(true);
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setActionLoading(courseToDelete);
      const token = getAuthToken();
      
      const response = await fetch(`/api/admin/courses/${courseToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus kursus');
      }

      // Remove from local state
      setCourses(prev => prev.filter(c => c.id !== courseToDelete));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: "Kursus berhasil dihapus."
      });
      setShowAlert(true);

      setShowDeleteAlert(false);
      setCourseToDelete(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    pending: courses.filter(c => c.status === 'PENDING_REVIEW').length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
    archived: courses.filter(c => c.status === 'ARCHIVED').length,
  };

  // Get unique categories
  const categories = Array.from(new Set(courses.map(c => c.category?.name).filter((name): name is string => Boolean(name))));

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && courses.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data kursus...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        {/* SweetAlert Component untuk notifikasi biasa */}
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={3000}
          showCloseButton={true}
        />

        {/* SweetAlert untuk konfirmasi tolak kursus */}
        <SweetAlert
          type="error"
          title="Tolak Kursus?"
          message="Kursus akan dikembalikan ke status Draft. Berikan alasan penolakan untuk mentor."
          show={showRejectAlert}
          onClose={() => {
            setShowRejectAlert(false);
            setRejectReason('');
          }}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Textarea untuk alasan penolakan */}
          <div className="mt-4">
            <Textarea
              placeholder="Alasan penolakan (opsional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#005EB8] focus:ring-[#005EB8] rounded-lg"
            />
          </div>
          
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowRejectAlert(false);
                setRejectReason('');
              }}
              disabled={actionLoading === courseToReject}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleRejectCourse}
              disabled={actionLoading === courseToReject}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {actionLoading === courseToReject ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        {/* SweetAlert untuk konfirmasi hapus kursus */}
        <SweetAlert
          type="error"
          title="Hapus Kursus?"
          message="Tindakan ini tidak dapat dibatalkan. Kursus beserta semua data terkait akan dihapus secara permanen."
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteAlert(false)}
              disabled={actionLoading === courseToDelete}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={actionLoading === courseToDelete}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {actionLoading === courseToDelete ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <BookOpen className="h-8 w-8 text-[#005EB8]" />
                Manajemen Kursus
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manajemen dan approval kursus dari mentor
              </p>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {pagination.total} Kursus
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <Archive className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Archived</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archived}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                    Daftar Kursus
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {pagination.total} kursus ditemukan
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
                      placeholder="Cari kursus atau mentor..."
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
                    <SelectTrigger className="w-full md:w-[200px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[200px]">
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Menunggu Review</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={(value) => {
                    setFilterCategory(value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}>
                    <SelectTrigger className="w-full md:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table - Desktop / Cards - Mobile & Tablet */}
              {loading && courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <span className="text-gray-600 dark:text-gray-400">Memuat data kursus...</span>
                </div>
              ) : filteredCourses.length > 0 ? (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {filteredCourses.map((course) => (
                      <Card key={course.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: Title & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-semibold text-gray-900 dark:text-white truncate" title={course.title}>
                                {course.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {course.mentor.user.full_name}
                              </p>
                            </div>
                            {getStatusBadge(course.status)}
                          </div>

                          {/* Category */}
                          <div className="mb-3">
                            <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none text-xs">
                              {course.category?.name || 'Tanpa Kategori'}
                            </Badge>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatNumber(course._count?.enrollments || course.total_students || 0)}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400]" />
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {course.average_rating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Harga</p>
                              {course.is_free ? (
                                <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none text-xs">
                                  Gratis
                                </Badge>
                              ) : (
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(course.price).replace('Rp', 'Rp ')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Link href={`/courses/${course.slug || course.id}`} className="flex-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full h-8 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detail
                              </Button>
                            </Link>
                            {course.status === 'PENDING_REVIEW' && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => handleApproveCourse(course.id)}
                                  className="h-8 px-3 bg-[#008A00] hover:bg-[#007000] text-white"
                                  disabled={actionLoading === course.id}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => openRejectDialog(course.id)}
                                  className="h-8 px-3 bg-[#D93025] hover:bg-[#C02920] text-white"
                                  disabled={actionLoading === course.id}
                                >
                                  <XCircle className="h-4 w-4" />
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
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[220px] px-4 py-3">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[200px] px-4 py-3">
                          Mentor
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[130px] px-4 py-3">
                          Kategori
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[90px] px-4 py-3 text-center">
                          Siswa
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3 text-right">
                          Harga
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[90px] px-4 py-3 text-center">
                          Rating
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[140px] px-4 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[90px] px-4 py-3 text-center">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate" title={course.title}>
                                {course.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white text-sm truncate" title={course.mentor.user.full_name}>
                                {course.mentor.user.full_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={course.mentor.user.email}>
                                {course.mentor.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none text-xs truncate max-w-[120px]" title={course.category?.name || 'Tanpa Kategori'}>
                              {course.category?.name || 'Tanpa Kategori'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(course._count?.enrollments || course.total_students || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-end">
                              {course.is_free ? (
                                <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">
                                  Gratis
                                </Badge>
                              ) : (
                                <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                  {formatCurrency(course.price)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-center">
                              <Star className="h-4 w-4 text-[#F4B400]" fill="currentColor" stroke="none" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {course.average_rating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              {getStatusBadge(course.status)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={actionLoading === course.id}
                                    className="h-8 w-8 p-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                  >
                                    {actionLoading === course.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/courses/${course.slug || course.id}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <Eye className="h-4 w-4" />
                                      <span>Lihat Detail</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {course.status === 'PENDING_REVIEW' && (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleApproveCourse(course.id)}
                                        className="text-[#008A00] dark:text-[#4CAF50] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Setujui
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => openRejectDialog(course.id)}
                                        className="text-[#D93025] dark:text-[#F44336] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Tolak
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(course.id)}
                                    className="text-[#D93025] dark:text-[#F44336] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak ada kursus ditemukan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                          setFilterCategory('all');
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
              loading={loading}
            />
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}