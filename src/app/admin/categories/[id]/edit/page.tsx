'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  FolderTree,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export default function EditCategory() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: '',
    order: 0,
    is_active: true,
  });

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

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch category and all categories
  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch current category
        const categoryResponse = await fetch(`/api/admin/categories/${categoryId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!categoryResponse.ok) {
          throw new Error('Kategori tidak ditemukan');
        }

        const categoryData = await categoryResponse.json();
        const cat = categoryData.category;
        setCategory(cat);
        setFormData({
          name: cat.name,
          description: cat.description || '',
          parent_id: cat.parent_id || '',
          order: cat.order,
          is_active: cat.is_active,
        });

        // Fetch all categories for parent dropdown
        const categoriesResponse = await fetch(`/api/admin/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setAllCategories(categoriesData.categories || []);
        }
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
    };

    fetchData();
  }, [categoryId, getAuthToken]);

  // Get parent categories (exclude current and its children)
  const availableParents = allCategories.filter(
    (c) => c.id !== categoryId && c.parent_id !== categoryId && !c.parent_id
  );

  // Handle save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: 'Nama kategori harus diisi'
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

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
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

      const data = await response.json();
      setCategory(data.category);
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: 'Kategori berhasil diperbarui'
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

  // Handle delete
  const handleDelete = async () => {
    if ((category?._count?.courses || 0) > 0) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: 'Tidak dapat menghapus kategori yang memiliki kursus'
      });
      setShowAlert(true);
      setShowDeleteAlert(false);
      return;
    }

    try {
      setDeleting(true);
      const token = getAuthToken();

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus kategori');
      }

      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: 'Kategori berhasil dihapus'
      });
      setShowAlert(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/admin/categories');
      }, 2000);
      
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menghapus kategori'
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (loading) {
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

  if (!category) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <FolderTree className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Kategori tidak ditemukan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Kategori yang Anda cari tidak ada atau telah dihapus
            </p>
            <Link href="/admin/categories">
              <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar
              </Button>
            </Link>
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
          message={`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`}
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {category.name}
                </p>
                {category._count?.courses && category._count.courses > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Memiliki {category._count.courses} kursus
                  </p>
                )}
              </div>
            </div>
            
            {category._count?.courses && category._count.courses > 0 ? (
              <div className="p-3 bg-[#F4B400]/10 border border-[#F4B400]/20 rounded-lg mb-4">
                <p className="text-sm text-[#F4B400] dark:text-yellow-300">
                  ⚠️ Kategori ini memiliki {category._count.courses} kursus.
                  {category._count.courses > 0 && (
                    <span className="block mt-1">
                      Tidak dapat dihapus. Pindahkan atau hapus kursus terlebih dahulu.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-red-600 dark:text-red-400 mb-4">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            )}
          </div>
          
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
              disabled={deleting || (category?._count?.courses || 0) > 0}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
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
          <div className="flex items-center gap-4">
            <Link href="/admin/categories">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <FolderTree className="h-8 w-8 text-[#005EB8]" />
                Edit Kategori
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Perbarui informasi kategori "{category.name}"
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#005EB8]/10 rounded-xl">
                    <FolderTree className="h-8 w-8 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Slug</p>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded border dark:border-gray-700 font-medium">
                      {category.slug}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#005EB8]" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{category._count?.courses || 0}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                  </div>
                  <Badge className={category.is_active ? 'bg-[#008A00] text-white border border-[#008A00] pointer-events-none' : 'bg-gray-100 text-gray-600 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}>
                    {category.is_active ? 'Aktif' : 'Non-aktif'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 dark:text-white">Nama Kategori *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pemrograman Web"
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900 dark:text-white">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat kategori..."
                  rows={4}
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deskripsi akan membantu pengguna memahami kategori ini
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent" className="text-gray-900 dark:text-white">Kategori Induk</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800">
                    <SelectValue placeholder="Pilih kategori induk (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada (Kategori Utama)</SelectItem>
                    {availableParents.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kategori induk menentukan struktur hierarki kategori
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="order" className="text-gray-900 dark:text-white">Urutan</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Angka lebih kecil akan ditampilkan lebih dulu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Status</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Non-aktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Kategori non-aktif tidak ditampilkan ke user
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={(category._count?.courses || 0) > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Kategori
                </Button>
                <div className="flex gap-3">
                  <Link href="/admin/categories" className="flex-1">
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600">
                      Batal
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name.trim() || saving}
                    className="flex-1 bg-[#005EB8] hover:bg-[#004A93] text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {(category._count?.courses || 0) > 0 && (
                <div className="mt-4 p-3 bg-[#F4B400]/10 border border-[#F4B400]/30 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    * Kategori ini memiliki {category._count?.courses} kursus. 
                    Tidak dapat dihapus. Pindahkan atau hapus kursus terlebih dahulu.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}