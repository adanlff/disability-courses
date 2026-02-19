"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  BarChart3,
  Loader2,
  Send,
  BookOpen,
  Clock,
  CheckCircle,
  ListTodo,
  Star,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';
import MentorLayout from '@/components/mentor/mentor-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CoursesModal } from '@/components/modal/courses-modal';
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  is_free: boolean;
  status: CourseStatus;
  is_published: boolean;
  level: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  _count?: {
    enrollments: number;
    reviews: number;
    sections: number;
  };
  average_rating?: number;
  rejected_reason?: string | null;
}

// Rating Stars Component
const RatingStars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-[#F4B400] fill-[#F4B400]" : "text-gray-300 dark:text-gray-700"}`}
        />
      ))}
    </div>
  );
};

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MentorCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12, // Changed to 12 items per page
    total: 0,
    totalPages: 0,
  });
  
  // Submit modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // SweetAlert states
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
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get token from localStorage
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        setLoading(false);
        return;
      }

      // Build query params
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      // Add status filter if not 'all'
      if (filterStatus !== 'all') {
        params.append('status', filterStatus.toUpperCase());
      }

      // Use dedicated mentor courses endpoint
      const response = await fetch(`/api/mentors/courses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kursus');
      }

      const data = await response.json();
      
      // Handle both response formats: { courses: [] } or { success: true, data: [] }
      const coursesArray = data.courses || data.data || [];
      
      // Map courses with proper status
      const coursesWithStatus = coursesArray.map((course: Course) => ({
        ...course,
        status: course.status || 'DRAFT' as CourseStatus,
      }));
      setCourses(coursesWithStatus);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || coursesArray.length,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, filterStatus, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses, pagination.page]);

  // Filter and sort courses locally
  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'students') {
        return (b._count?.enrollments || 0) - (a._count?.enrollments || 0);
      } else if (sortBy === 'rating') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      } else if (sortBy === 'revenue') {
        const aRevenue = (a._count?.enrollments || 0) * a.price;
        const bRevenue = (b._count?.enrollments || 0) * b.price;
        return bRevenue - aRevenue;
      }
      // Default: recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Published</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Menunggu Review</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Archived</Badge>;
      case 'DRAFT':
      default:
        return <Badge className="bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Draft</Badge>;
    }
  };

  const getLevelLabel = (level: string) => {
    const levelMap: Record<string, string> = {
      'BEGINNER': 'Pemula',
      'INTERMEDIATE': 'Menengah',
      'ADVANCED': 'Mahir',
      'ALL_LEVELS': 'Semua Level',
    };
    return levelMap[level] || level;
  };

  // Open delete confirmation with SweetAlert
  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteAlert(true);
  };

  // Open submit for review modal
  const handleSubmitForReview = (course: Course) => {
    setSelectedCourse(course);
    setSubmitModalOpen(true);
  };

  // Delete course
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      setDeleting(true);
      const token = getAuthToken();
      
      const response = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus kursus');
      }

      // Remove course from local state
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${courseToDelete.title}" berhasil dihapus.`
      });
      setShowAlert(true);
      
      setShowDeleteAlert(false);
      setCourseToDelete(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menghapus kursus'
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  // Submit for review
  const handleSubmitConfirm = async () => {
    if (!selectedCourse) return;

    try {
      setSubmitLoading(true);
      const token = getAuthToken();
      
      // Use the publish endpoint which validates course content and sets PENDING_REVIEW for mentors
      const response = await fetch(`/api/courses/${selectedCourse.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim kursus untuk review');
      }

      // Update local state
      setCourses(prev => prev.map(c => 
        c.id === selectedCourse.id 
          ? { ...c, status: 'PENDING_REVIEW' as CourseStatus } 
          : c
      ));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${selectedCourse.title}" berhasil dikirim untuk review.`
      });
      setShowAlert(true);
      
      setSubmitModalOpen(false);
      setSelectedCourse(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal mengirim untuk review'
      });
      setShowAlert(true);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Calculate stats
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    pending: courses.filter(c => c.status === 'PENDING_REVIEW').length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600">Memuat data kursus...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCourses} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                Coba Lagi
              </Button>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
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

        {/* SweetAlert untuk konfirmasi hapus kursus */}
        <SweetAlert
          type="error"
          title="Hapus Kursus?"
          message={`Apakah Anda yakin ingin menghapus kursus "${courseToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.`}
          show={showDeleteAlert}
          onClose={() => {
            if (!deleting) {
              setShowDeleteAlert(false);
              setCourseToDelete(null);
            }
          }}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Tambahan tombol konfirmasi khusus untuk alert konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowDeleteAlert(false);
                setCourseToDelete(null);
              }}
              disabled={deleting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {deleting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Kursus
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <BookOpen className="h-8 w-8 text-[#005EB8]" />
                Kursus Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola semua kursus yang Anda buat
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Link href="/mentor/courses/create">
                <Button size="lg" className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                  <Plus className="h-5 w-5 mr-2" />
                  Buat Kursus Baru
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kursus</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu Review</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <BarChart3 className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
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
                    placeholder="Cari kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={(value) => {
                    setFilterStatus(value);
                  }}>
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_review">Menunggu Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Terbaru</SelectItem>
                      <SelectItem value="students">Siswa Terbanyak</SelectItem>
                      <SelectItem value="rating">Rating Tertinggi</SelectItem>
                      <SelectItem value="revenue">Pendapatan Tertinggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Belum ada kursus
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Mulai buat kursus pertama Anda
                        </p>
                        <Link href="/mentor/courses/create">
                          <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Kursus
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredCourses.map((course, index) => (
                <Card
                  key={course.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={course.thumbnail || 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800  '}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(course.status)}
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                        {getLevelLabel(course.level)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      
                      {/* Rejection reason */}
                      {course.status === 'DRAFT' && course.rejected_reason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-[#D93025]/20 dark:border-[#D93025]/30 rounded p-2 mb-3">
                          <p className="text-xs text-[#D93025] dark:text-[#D93025]">
                            <strong>Alasan penolakan:</strong> {course.rejected_reason}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <RatingStars rating={Math.round(course.average_rating || 0)} size="sm" />
                          <span>{course.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span>{formatNumber(course._count?.enrollments || 0)} siswa</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{course.category?.name || 'Tanpa Kategori'}</span>
                        <span className="font-bold text-[#005EB8]">
                          {course.is_free ? 'Gratis' : formatCurrency(course.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Button berdasarkan status */}
                      {course.status === 'DRAFT' ? (
                        <>
                          {/* Semua button untuk DRAFT - semua sama lebar */}
                          {/* Manage Content */}
                          <Link href={`/mentor/courses/${course.id}/sections`} className="flex-1 min-w-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <ListTodo className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* Edit */}
                          <Link href={`/mentor/courses/${course.id}/edit`} className="flex-1 min-w-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* Submit for Review hanya jika ada sections */}
                          {(course._count?.sections || 0) > 0 ? (
                            <div className="flex-1 min-w-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSubmitForReview(course)}
                                className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0"></div>
                          )}
                          
                          {/* Hapus */}
                          <div className="flex-1 min-w-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[#D93025] border-[#D93025] hover:bg-[#D93025]/10 hover:text-[#D93025]"
                              onClick={() => handleDeleteClick(course)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Untuk status selain DRAFT: Lihat dan Manage Content */}
                          <Link href={`/courses/${course.slug || course.id}`} className="flex-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                          </Link>
                          
                          <Link href={`/mentor/courses/${course.id}/sections`} className="flex-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <ListTodo className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

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

        {/* Submit Modal only for submit action */}
        <CoursesModal
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          loading={submitLoading}
          onConfirm={handleSubmitConfirm}
          type="submit"
          course={selectedCourse}
        />
      </MentorLayout>
    </ProtectedRoute>
  );
}