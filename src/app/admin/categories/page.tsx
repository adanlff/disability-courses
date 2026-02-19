'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  Loader2,
  FolderTree,
  Eye,
  EyeOff,
  BookOpen,
  AlertCircle,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryDialog } from '@/components/modal/categories-modal';
import Pagination from '@/components/ui/pagination'; // Import komponen pagination

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    courses: number;
  };
}

interface CategoryForm {
  name: string;
  description: string;
  parent_id: string;
  order: number;
  is_active: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed to 10 items per page
    total: 0,
    totalPages: 0,
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: '',
    order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  
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
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setAlertConfig({
          type: "error",
          title: "Error",
          message: 'Silakan login terlebih dahulu'
        });
        setShowAlert(true);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/categories?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data kategori');
      }

      const data = await response.json();
      setCategories(data.categories || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || data.categories?.length || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, searchTerm, pagination.limit]);

  useEffect(() => {
    fetchCategories(pagination.page);
  }, [fetchCategories, pagination.page]);

  // Filter categories locally (if needed for search)
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  // Get parent categories (categories without parent)
  const parentCategories = categories.filter(c => !c.parent_id);

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      order: category.order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  // Handle form field change
  const handleFormChange = (field: keyof CategoryForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save category
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: "Nama kategori wajib diisi"
      });
      setShowAlert(true);
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      const payload = {
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        order: formData.order,
        is_active: formData.is_active,
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : `/api/admin/categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan kategori');
      }

      await fetchCategories(pagination.page);
      setDialogOpen(false);
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: editingCategory ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan"
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menyimpan kategori'
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const toggleActive = async (category: Category) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah status kategori');
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: `Kategori ${!category.is_active ? "diaktifkan" : "dinonaktifkan"}`
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal mengubah status'
      });
      setShowAlert(true);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteAlert(true);
  };

  // Delete category
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      const token = getAuthToken();

      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus kategori');
      }

      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: "Kategori berhasil dihapus"
      });
      setShowAlert(true);
      
      setShowDeleteAlert(false);
      setCategoryToDelete(null);
      
      // Refresh data after deletion
      fetchCategories(pagination.page);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menghapus kategori'
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Stats
  const stats = {
    total: pagination.total,
    active: categories.filter((c) => c.is_active).length,
    inactive: categories.filter((c) => !c.is_active).length,
    withCourses: categories.filter((c) => (c._count?.courses || 0) > 0).length,
  };

  if (loading && categories.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data kategori...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
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

        {/* SweetAlert untuk konfirmasi hapus kategori */}
        <SweetAlert
          type="error"
          title="Hapus Kategori?"
          message={
            categoryToDelete 
              ? `Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.name}"?`
              : ""
          }
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {categoryToDelete && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Trash2 className="h-6 w-6 text-[#D93025]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {categoryToDelete.name}
                  </p>
                  {categoryToDelete._count?.courses && categoryToDelete._count.courses > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Memiliki {categoryToDelete._count.courses} kursus
                    </p>
                  )}
                </div>
              </div>
              
              {categoryToDelete._count?.courses && categoryToDelete._count.courses > 0 ? (
                <div className="p-3 bg-[#F4B400]/10 border border-[#F4B400]/20 rounded-lg mb-4">
                  <p className="text-sm text-[#F4B400] dark:text-[#F4B400]">
                    Kategori ini memiliki {categoryToDelete._count.courses} kursus.
                    {categoryToDelete._count.courses > 0 && (
                      <span className="block mt-1">
                        Tidak dapat dihapus. Pindahkan atau hapus kursus terlebih dahulu.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-[#D93025] dark:text-[#D93025] mb-4">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              )}
            </div>
          )}
          
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteAlert(false)}
              disabled={deleting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (categoryToDelete?._count?.courses || 0) > 0}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#B71C1C] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
            >
              {deleting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
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
                  <FolderTree className="h-8 w-8 text-[#005EB8]" />
                Manajemen Kategori
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola kategori kursus platform
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-4">
              <Button
                onClick={openCreateDialog}
                className="bg-[#005EB8] hover:bg-[#004A93] text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Tambah Kategori
              </Button>
            </div>
          </div>

          {showAlert && alertConfig.type === "error" && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D93025]" />
                  <p className="text-[#D93025] dark:text-red-400">{alertConfig.message}</p>
                </div>
                <button onClick={() => setShowAlert(false)} className="text-[#D93025] dark:text-red-400 hover:text-[#B71C1C] dark:hover:text-red-300">
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
                    <FolderTree className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kategori</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Eye className="h-6 w-6 text-[#008A00]" />
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
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <EyeOff className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Non-aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <BookOpen className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dengan Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <FolderTree className="h-5 w-5 text-[#005EB8]" />
                    Daftar Kategori
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {pagination.total} kategori ditemukan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Cari kategori berdasarkan nama atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {loading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <span className="text-gray-600 dark:text-gray-400">Memuat data kategori...</span>
                </div>
              ) : filteredCategories.length > 0 ? (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {filteredCategories.map((category) => (
                      <Card key={category.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {category.parent_id && (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(category)}
                              className={`h-8 w-8 p-0 ${
                                category.is_active
                                  ? "border-[#008A00] text-[#008A00] hover:bg-[#008A00]/10"
                                  : "border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                              }`}
                            >
                              {category.is_active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {/* Info */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Slug</p>
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">
                                {category.slug}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                              <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                                {category._count?.courses || 0}
                              </Badge>
                            </div>
                          </div>

                          {/* Parent */}
                          {category.parent && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Parent</p>
                              <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                                {category.parent.name}
                              </Badge>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              className="flex-1 h-8 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                              onClick={() => openDeleteDialog(category)}
                              disabled={(category._count?.courses || 0) > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Slug</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">Parent</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Kursus</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow
                          key={category.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {category.parent_id && (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">
                              {category.slug}
                            </code>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {category.parent ? (
                              <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                                {category.parent.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                              {category._count?.courses || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(category)}
                              className={`h-8 w-8 p-0 ${
                                category.is_active
                                  ? "border-[#008A00] text-[#008A00] hover:bg-[#008A00]/10 dark:border-[#008A00] dark:text-[#008A00]"
                                  : "border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                              }`}
                            >
                              {category.is_active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(category)}
                                className="h-8 w-8 p-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                                onClick={() => openDeleteDialog(category)}
                                disabled={(category._count?.courses || 0) > 0}
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
              ) : (
                <div className="text-center py-12">
                  <FolderTree className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? "Kategori tidak ditemukan" : "Belum ada kategori"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Mulai dengan menambahkan kategori pertama"}
                  </p>
                  <Button onClick={openCreateDialog} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
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

          {/* Category Dialog (Create/Edit) */}
          <CategoryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingCategory={editingCategory}
            parentCategories={parentCategories}
            formData={formData}
            loading={saving}
            onFormChange={handleFormChange}
            onSave={handleSave}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}