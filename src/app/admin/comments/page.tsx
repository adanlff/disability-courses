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
  MessageSquare,
  Search,
  Loader2,
  Trash2,
  Clock,
  BookOpen,
  Edit3,
  AlertCircle,
  Reply,
  Filter,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";
import Link from "next/link";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

interface Comment {
  id: string;
  user_id: string;
  material_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  material: {
    id: string;
    title: string;
    section: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
  parent: {
    id: string;
    content: string;
  } | null;
  _count: {
    replies: number;
  };
}

interface Stats {
  total: number;
  today: number;
  edited: number;
  replies: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, edited: 0, replies: 0 });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed to 10 items per page
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchComments = useCallback(async () => {
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

      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/admin/comments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data komentar");

      const data = await response.json();
      setComments(data.comments || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
      setStats(data.stats || { total: 0, today: 0, edited: 0, replies: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDeleteClick = (comment: Comment) => {
    setCommentToDelete(comment);
    setShowConfirmAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    try {
      setDeleting(true);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/comments?id=${commentToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal menghapus komentar");

      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setShowConfirmAlert(false);
      setCommentToDelete(null);
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: "Komentar berhasil dihapus."
      });
      setShowAlert(true);

      // Refresh comments
      fetchComments();
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal menghapus komentar"
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

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

        {/* SweetAlert untuk konfirmasi hapus komentar */}
        <SweetAlert
          type="error"
          title="Hapus Komentar?"
          message={
            commentToDelete 
              ? `Apakah Anda yakin ingin menghapus komentar dari "${commentToDelete.user.full_name}"? Semua balasan dari komentar ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`
              : ""
          }
          show={showConfirmAlert}
          onClose={() => setShowConfirmAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {commentToDelete && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold text-sm">
                  {commentToDelete.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{commentToDelete.user.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(commentToDelete.created_at)}</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 border-l-2 border-[#D93025] pl-3 italic">
                "{truncateText(commentToDelete.content, 150)}"
              </p>
            </div>
          )}
          
          {/* Tambahan tombol konfirmasi khusus untuk alert konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowConfirmAlert(false)}
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
                  Hapus Komentar
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <MessageSquare className="h-8 w-8 text-[#005EB8]" />
                Manajemen Komentar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola semua komentar pengguna pada materi kursus
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <MessageSquare className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Komentar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Edit3 className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Diedit</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.edited}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Reply className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Balasan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.replies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <MessageSquare className="h-5 w-5 text-[#005EB8]" />
                    Daftar Komentar
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {pagination.total} komentar ditemukan
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
                      placeholder="Cari komentar, nama user, atau judul kursus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              {loading && comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Memuat komentar...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? "Komentar tidak ditemukan" : "Belum ada komentar"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Belum ada komentar yang dibuat oleh pengguna"}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                    >
                      Reset Pencarian
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {comments.map((comment) => (
                      <Card key={comment.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: User Info */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {comment.user.avatar_url ? (
                                <img
                                  src={comment.user.avatar_url}
                                  alt={comment.user.full_name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-bold">
                                  {comment.user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                  {comment.user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {comment.user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                              onClick={() => handleDeleteClick(comment)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Comment Content */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300" title={comment.content}>
                              {truncateText(comment.content, 150)}
                            </p>
                            {comment.parent && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <Reply className="h-3 w-3" />
                                Balasan dari: {truncateText(comment.parent.content, 50)}
                              </p>
                            )}
                          </div>

                          {/* Course Link */}
                          <div className="mb-3">
                            <Link
                              href={`/courses/${comment.material.section.course.slug}`}
                              className="text-sm text-[#005EB8] hover:underline font-medium"
                            >
                              {comment.material.section.course.title}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {comment.material.title}
                            </p>
                          </div>

                          {/* Footer: Badges & Date */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-1">
                              {comment.is_edited && (
                                <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs">
                                  <Edit3 className="h-3 w-3 mr-1" />Diedit
                                </Badge>
                              )}
                              {comment.parent && (
                                <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none text-xs">
                                  <Reply className="h-3 w-3 mr-1" />Reply
                                </Badge>
                              )}
                              {comment._count.replies > 0 && (
                                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-xs">
                                  {comment._count.replies}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(comment.created_at)}
                            </span>
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
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[180px] px-4 py-3">
                          Pengguna
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[300px] px-4 py-3">
                          Komentar
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[200px] px-4 py-3">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[100px] px-4 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[110px] px-4 py-3">
                          Tanggal
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[80px] px-4 py-3 text-center">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comments.map((comment) => (
                        <TableRow key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {comment.user.avatar_url ? (
                                <img
                                  src={comment.user.avatar_url}
                                  alt={comment.user.full_name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-bold">
                                  {comment.user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={comment.user.full_name}>
                                  {comment.user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={comment.user.email}>
                                  {comment.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white line-clamp-2" title={comment.content}>
                                {truncateText(comment.content, 100)}
                              </p>
                              {comment.parent && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                  <Reply className="h-3 w-3" />
                                  Balasan dari: {truncateText(comment.parent.content, 40)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <Link
                                href={`/courses/${comment.material.section.course.slug}`}
                                className="text-sm text-[#005EB8] hover:underline font-medium truncate block"
                                title={comment.material.section.course.title}
                              >
                                {truncateText(comment.material.section.course.title, 30)}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={comment.material.title}>
                                {comment.material.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {comment.is_edited && (
                                <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs">
                                  <Edit3 className="h-3 w-3 mr-1" />Diedit
                                </Badge>
                              )}
                              {comment.parent && (
                                <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none text-xs">
                                  <Reply className="h-3 w-3 mr-1" />Reply
                                </Badge>
                              )}
                              {comment._count.replies > 0 && (
                                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-xs">
                                  {comment._count.replies}
                                </Badge>
                              )}
                              {!comment.is_edited && !comment.parent && comment._count.replies === 0 && (
                                <Badge className="bg-gray-100 text-gray-600 border border-gray-200 pointer-events-none text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                  Normal
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(comment.created_at)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                                onClick={() => handleDeleteClick(comment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
                  </div>
                </>
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
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              loading={loading}
            />
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}