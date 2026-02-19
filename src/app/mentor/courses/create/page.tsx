"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  Plus,
  Trash2,
  Crop
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MentorLayout from '@/components/mentor/mentor-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageCropper from '@/components/modal/image-cropper';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: Category[];
}

interface FormData {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  level: string;
  price: string;
  language: string;
  isFree: boolean;
  isPremium: boolean;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  tags: string[];
  thumbnail: File | null;
}

export default function CreateCourse() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    level: 'BEGINNER',
    price: '',
    language: 'id',
    isFree: false,
    isPremium: false,
    requirements: [''],
    whatYouWillLearn: [''],
    targetAudience: [''],
    tags: [],
    thumbnail: null,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`/api/courses/categories`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil kategori');
        }

        const data = await response.json();
        console.log('Categories API response:', data);
        
        // Handle different response structures
        let categoriesData: Category[] = [];
        
        if (data.success && data.data?.categories) {
          // Structure: { success: true, data: { categories: [...] } }
          categoriesData = data.data.categories;
        } else if (data.data?.categories) {
          // Structure: { data: { categories: [...] } }
          categoriesData = data.data.categories;
        } else if (data.categories) {
          // Structure: { categories: [...] }
          categoriesData = data.categories;
        } else if (Array.isArray(data.data)) {
          // Structure: { data: [...] }
          categoriesData = data.data;
        } else if (Array.isArray(data)) {
          // Structure: [...]
          categoriesData = data;
        }

        if (categoriesData.length > 0) {
          // Flatten categories including children
          const flatCategories: Category[] = [];
          categoriesData.forEach((cat: Category) => {
            flatCategories.push(cat);
            if (cat.children && cat.children.length > 0) {
              cat.children.forEach((child: Category) => {
                flatCategories.push({
                  ...child,
                  name: `${cat.name} > ${child.name}`,
                });
              });
            }
          });
          setCategories(flatCategories);
          console.log('Loaded categories:', flatCategories.length);
        } else {
          console.warn('No categories found in response');
          setError('Tidak ada kategori tersedia. Silakan tambahkan kategori terlebih dahulu.');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Gagal mengambil kategori. Pastikan server backend berjalan.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array fields
  const handleArrayFieldChange = (field: 'requirements' | 'whatYouWillLearn' | 'targetAudience', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayField = (field: 'requirements' | 'whatYouWillLearn' | 'targetAudience') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'requirements' | 'whatYouWillLearn' | 'targetAudience', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        setIsSubmitting(false);
        return;
      }

      // Upload thumbnail if exists
      let thumbnailUrl: string | undefined;
      if (formData.thumbnail) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.thumbnail);
          uploadFormData.append('type', 'courses'); // Save to uploads/images/courses/
          
          const uploadResponse = await fetch(`/api/uploads/images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: uploadFormData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            if (uploadResult.success && uploadResult.data?.url) {
              thumbnailUrl = uploadResult.data.url;
            }
          } else {
            console.error('Thumbnail upload failed');
          }
        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          // Continue without thumbnail
        }
      }

      // Prepare data for API - use snake_case to match backend schema
      const priceValue = parseFloat(formData.price) || 0;
      const isFreeValue = formData.isFree || priceValue === 0;
      
      const courseData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || formData.shortDescription + '\n\n' + 'Deskripsi lengkap akan ditambahkan.',
        short_description: formData.shortDescription || undefined,
        category_id: formData.categoryId,
        level: formData.level,
        price: priceValue,
        language: formData.language,
        is_free: isFreeValue,
        is_premium: formData.isPremium,
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        what_you_will_learn: formData.whatYouWillLearn.filter(w => w.trim() !== ''),
        target_audience: formData.targetAudience.filter(t => t.trim() !== ''),
        tags: formData.tags,
      };

      // Add thumbnail URL if uploaded
      if (thumbnailUrl) {
        courseData.thumbnail = thumbnailUrl;
      }

      // Validate required fields (validate from formData which has proper types)
      if (!formData.title || formData.title.length < 5) {
        setError('Judul harus minimal 5 karakter');
        setIsSubmitting(false);
        return;
      }

      if (!formData.description || formData.description.length < 50) {
        setError('Deskripsi harus minimal 50 karakter');
        setIsSubmitting(false);
        return;
      }

      if (!formData.categoryId) {
        setError('Pilih kategori');
        setIsSubmitting(false);
        return;
      }

      if (formData.whatYouWillLearn.filter(w => w.trim() !== '').length === 0) {
        setError('Tambahkan minimal 1 hal yang akan dipelajari');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal membuat kursus');
      }

      // Redirect to courses list on success
      router.push('/mentor/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.length >= 5 && 
    formData.description.length >= 50 && 
    formData.categoryId && 
    formData.whatYouWillLearn.filter(w => w.trim() !== '').length > 0;

  const levelOptions = [
    { value: 'BEGINNER', label: 'Pemula' },
    { value: 'INTERMEDIATE', label: 'Menengah' },
    { value: 'ADVANCED', label: 'Mahir' },
    { value: 'ALL_LEVELS', label: 'Semua Level' },
  ];

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/mentor/courses">
              {/* Button Ikon Panah Kiri - Style diubah seperti button Lihat Semua di dashboard */}
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
                <Plus className="h-8 w-8 text-[#005EB8]" />
                Buat Kursus Baru
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Buat kursus baru dan mulai berbagi pengetahuan Anda
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Informasi Dasar</CardTitle>
                <CardDescription>
                  Isi informasi umum tentang kursus Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Kursus *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Dasar-Dasar Pemrograman Web"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimal 5 karakter, maksimal 200 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Deskripsi Singkat</Label>
                  <Textarea
                    id="shortDescription"
                    placeholder="Tulis deskripsi singkat tentang kursus (100-200 karakter)"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deskripsi ini akan tampil di listing kursus
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Lengkap * (min 50 karakter)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tulis deskripsi lengkap tentang kursus, tujuan pembelajaran, dan target audiens"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.description.length}/50 karakter minimum
                  </p>
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-2">
                  <Label>Thumbnail Kursus</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                    {thumbnailPreview ? (
                      <div className="space-y-4">
                        <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setFormData(prev => ({ ...prev, thumbnail: null }));
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                          Klik X untuk menghapus dan upload gambar baru
                        </p>
                      </div>
                    ) : (
                      <div className="text-center relative">
                        <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Klik atau drag gambar thumbnail ke sini
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG, WebP (max 5MB) - Akan di-crop ke rasio 16:9
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validate file size
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Ukuran gambar maksimal 5MB');
                                return;
                              }
                              // Create preview and open cropper
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTempImageSrc(reader.result as string);
                                setCropperOpen(true);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gambar akan disimpan ke folder uploads/images/courses/
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    {loadingCategories ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat kategori...
                      </div>
                    ) : (
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleInputChange('categoryId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level Kursus</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleInputChange('level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Kursus (Rupiah) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Contoh: 499000"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                      disabled={formData.isFree}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="isFree"
                        checked={formData.isFree}
                        onChange={(e) => {
                          handleInputChange('isFree', e.target.checked);
                          if (e.target.checked) handleInputChange('price', '0');
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                      />
                      <Label htmlFor="isFree" className="text-sm font-normal cursor-pointer">
                        Kursus Gratis
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Bahasa</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">Indonesia</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You Will Learn */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Yang Akan Dipelajari *</CardTitle>
                <CardDescription>
                  Tambahkan minimal 1 hal yang akan dipelajari siswa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Contoh: Memahami dasar HTML dan CSS"
                      value={item}
                      onChange={(e) => handleArrayFieldChange('whatYouWillLearn', index, e.target.value)}
                    />
                    {formData.whatYouWillLearn.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayField('whatYouWillLearn', index)}
                        className="text-red-600 border-gray-300 dark:border-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayField('whatYouWillLearn')}
                  className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Poin
                </Button>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Persyaratan</CardTitle>
                <CardDescription>
                  Prasyarat yang dibutuhkan siswa untuk mengikuti kursus ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.requirements.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Contoh: Memiliki laptop/komputer"
                      value={item}
                      onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayField('requirements', index)}
                        className="text-red-600 border-gray-300 dark:border-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayField('requirements')}
                  className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Persyaratan
                </Button>
              </CardContent>
            </Card>

            {/* Checklist Sebelum Submit */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <CheckCircle className="h-6 w-6 text-[#005EB8]" />
                  Checklist Sebelum Submit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.title.length >= 5 ? 'text-[#008A00]' : 'text-gray-300'}`} />
                    <span className={formData.title.length >= 5 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                      Judul kursus sudah diisi (min. 5 karakter)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.description.length >= 50 ? 'text-[#008A00]' : 'text-gray-300'}`} />
                    <span className={formData.description.length >= 50 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                      Deskripsi sudah diisi (min. 50 karakter)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.categoryId ? 'text-[#008A00]' : 'text-gray-300'}`} />
                    <span className={formData.categoryId ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                      Kategori sudah dipilih
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.whatYouWillLearn.filter(w => w.trim() !== '').length > 0 ? 'text-[#008A00]' : 'text-gray-300'}`} />
                    <span className={formData.whatYouWillLearn.filter(w => w.trim() !== '').length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                      Minimal 1 hal yang akan dipelajari
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.price || formData.isFree ? 'text-[#008A00]' : 'text-gray-300'}`} />
                    <span className={formData.price || formData.isFree ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                      Harga sudah diisi
                    </span>
                  </li>
                </ul>

                {/* Tombol Batal dan Buat Kursus */}
                <div className="flex gap-4 mt-8">
                  <Link href="/mentor/courses" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]" 
                      type="button"
                    >
                      Batal
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="flex-1 bg-[#005EB8] hover:bg-[#004A93] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Membuat Kursus...
                      </>
                    ) : (
                      'Buat Kursus'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image Cropper Dialog */}
            {tempImageSrc && (
              <ImageCropper
                imageSrc={tempImageSrc}
                open={cropperOpen}
                aspectRatio={16 / 9}
                onCropComplete={(croppedBlob) => {
                  // Convert blob to file
                  const file = new File([croppedBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
                  setFormData(prev => ({ ...prev, thumbnail: file }));
                  // Create preview from blob
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setThumbnailPreview(reader.result as string);
                  };
                  reader.readAsDataURL(croppedBlob);
                  setCropperOpen(false);
                  setTempImageSrc(null);
                }}
                onCancel={() => {
                  setCropperOpen(false);
                  setTempImageSrc(null);
                }}
              />
            )}
          </form>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}