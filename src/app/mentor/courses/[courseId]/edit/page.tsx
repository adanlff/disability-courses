// app/mentor/courses/[courseId]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  X,
  Check,
  Save,
  Eye,
  BarChart3,
  Users,
  Star,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  TrendingUp,
  Award,
  Sparkles,
  Crop,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import ImageCropper from "@/components/modal/image-cropper";

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  price: number;
  discount_price?: number | null;
  is_free: boolean;
  is_premium: boolean;
  is_published?: boolean;
  status?: string;
  level: string;
  language: string;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    enrollments: number;
    reviews: number;
  };
  average_rating?: number;
}

interface FormData {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  level: string;
  price: string;
  discountPrice: string;
  language: string;
  isFree: boolean;
  isPremium: boolean;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  tags: string[];
  thumbnail: File | null;
  thumbnailUrl: string | null;
}

export default function EditCourse() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [courseStats, setCourseStats] = useState({
    students: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
    status: 'draft',
  });

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    level: "BEGINNER",
    price: "",
    discountPrice: "",
    language: "id",
    isFree: false,
    isPremium: false,
    requirements: [""],
    whatYouWillLearn: [""],
    targetAudience: [""],
    tags: [],
    thumbnail: null,
    thumbnailUrl: null,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`/api/courses/categories`);

        if (!response.ok) {
          throw new Error("Gagal mengambil kategori");
        }

        const data = await response.json();
        console.log('Categories API response:', data);
        
        // Handle different response structures
        let categoriesData: Category[] = [];
        
        if (data.success && data.data?.categories) {
          categoriesData = data.data.categories;
        } else if (data.data?.categories) {
          categoriesData = data.data.categories;
        } else if (data.categories) {
          categoriesData = data.categories;
        } else if (Array.isArray(data.data)) {
          categoriesData = data.data;
        } else if (Array.isArray(data)) {
          categoriesData = data;
        }

        if (categoriesData.length > 0) {
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
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data kursus");
        }

        const result = await response.json();
        
        // Handle both response formats: { course: {...} } or { success, data }
        const course: CourseData = result.course || result.data || result;
        
        if (course && course.id) {
          setFormData({
            title: course.title || "",
            description: course.description || "",
            shortDescription: course.short_description || "",
            categoryId: course.category_id || "",
            level: course.level || "BEGINNER",
            price: course.price?.toString() || "0",
            discountPrice: course.discount_price?.toString() || "",
            language: course.language || "id",
            isFree: course.is_free || false,
            isPremium: course.is_premium || false,
            requirements: course.requirements?.length > 0 ? course.requirements : [""],
            whatYouWillLearn: course.what_you_will_learn?.length > 0 ? course.what_you_will_learn : [""],
            targetAudience: course.target_audience?.length > 0 ? course.target_audience : [""],
            tags: course.tags || [],
            thumbnail: null,
            thumbnailUrl: course.thumbnail_url || course.thumbnail || null,
          });

          setThumbnailPreview(course.thumbnail_url || course.thumbnail || null);

          setCourseStats({
            students: course._count?.enrollments || 0,
            revenue: (course._count?.enrollments || 0) * (course.price || 0),
            rating: course.average_rating || 0,
            reviews: course._count?.reviews || 0,
            status: course.status === 'PUBLISHED' || course.is_published ? 'active' : 'draft',
          });
        } else {
          throw new Error("Gagal mengambil data kursus");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, getAuthToken]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle array fields
  const handleArrayFieldChange = (
    field: "requirements" | "whatYouWillLearn" | "targetAudience",
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayField = (field: "requirements" | "whatYouWillLearn" | "targetAudience") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (
    field: "requirements" | "whatYouWillLearn" | "targetAudience",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        setIsSubmitting(false);
        return;
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        categoryId: formData.categoryId,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        language: formData.language,
        isFree: formData.isFree,
        isPremium: formData.isPremium,
        requirements: formData.requirements.filter((r) => r.trim() !== ""),
        whatYouWillLearn: formData.whatYouWillLearn.filter((w) => w.trim() !== ""),
        targetAudience: formData.targetAudience.filter((t) => t.trim() !== ""),
        tags: formData.tags,
      };

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui kursus");
      }

      // Redirect to courses list on success
      router.push("/mentor/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.title.length >= 5 &&
    formData.description.length >= 50 &&
    formData.categoryId &&
    formData.whatYouWillLearn.filter((w) => w.trim() !== "").length > 0;

  const levelOptions = [
    { value: "BEGINNER", label: "Pemula" },
    { value: "INTERMEDIATE", label: "Menengah" },
    { value: "ADVANCED", label: "Mahir" },
    { value: "ALL_LEVELS", label: "Semua Level" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "jt";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data kursus...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/mentor/courses">
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
                  <Edit3 className="h-8 w-8 text-[#005EB8]" />
                  Edit Kursus
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Perbarui informasi dan konten kursus Anda
                </p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Link href={`/courses/${courseId}`}>
                <Button
                  className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Course Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(courseStats.students)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <TrendingUp className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(courseStats.revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Star className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courseStats.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Award className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(courseStats.reviews)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informasi Dasar */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Informasi Dasar
                </CardTitle>
                <CardDescription>
                  Perbarui informasi umum tentang kursus Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-900 dark:text-gray-300">Judul Kursus *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Dasar-Dasar Pemrograman Web"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimal 5 karakter, maksimal 200 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription" className="text-gray-900 dark:text-gray-300">Deskripsi Singkat</Label>
                  <Textarea
                    id="shortDescription"
                    placeholder="Tulis deskripsi singkat tentang kursus"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleInputChange("shortDescription", e.target.value)
                    }
                    rows={2}
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 dark:text-gray-300">Deskripsi Lengkap * (min 50 karakter)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tulis deskripsi lengkap tentang kursus, tujuan pembelajaran, dan target audiens"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={5}
                    required
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.description.length}/50 karakter minimum
                  </p>
                </div>

                {/* Thumbnail Upload - Dipindahkan ke sini seperti di halaman create */}
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
                              setFormData(prev => ({ ...prev, thumbnail: null, thumbnailUrl: null }));
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
                          onChange={handleThumbnailChange}
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
                    <Label htmlFor="category" className="text-gray-900 dark:text-gray-300">Kategori *</Label>
                    {loadingCategories ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat kategori...
                      </div>
                    ) : (
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) =>
                          handleInputChange("categoryId", value)
                        }
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white">
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
                    <Label htmlFor="level" className="text-gray-900 dark:text-gray-300">Level Kursus</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) =>
                        handleInputChange("level", value)
                      }
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white">
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
                    <Label htmlFor="price" className="text-gray-900 dark:text-gray-300">Harga Kursus (Rupiah) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Contoh: 499000"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                      disabled={formData.isFree}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="isFree"
                        checked={formData.isFree}
                        onChange={(e) => {
                          handleInputChange("isFree", e.target.checked);
                          if (e.target.checked) handleInputChange("price", "0");
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8] dark:border-gray-600"
                      />
                      <Label htmlFor="isFree" className="text-sm font-normal cursor-pointer text-gray-900 dark:text-gray-300">
                        Kursus Gratis
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-900 dark:text-gray-300">Bahasa</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange("language", value)}
                    >
                      <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white">
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
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Yang Akan Dipelajari *
                </CardTitle>
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
                      onChange={(e) =>
                        handleArrayFieldChange("whatYouWillLearn", index, e.target.value)
                      }
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                    />
                    {formData.whatYouWillLearn.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayField("whatYouWillLearn", index)}
                        className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayField("whatYouWillLearn")}
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
                      onChange={(e) =>
                        handleArrayFieldChange("requirements", index, e.target.value)
                      }
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 dark:text-white"
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayField("requirements", index)}
                        className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayField("requirements")}
                  className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Persyaratan
                </Button>
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <CheckCircle className="h-6 w-6 text-[#005EB8]" />
                  Checklist Sebelum Update
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        formData.title.length >= 5 ? "text-[#008A00]" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                    <span
                      className={
                        formData.title.length >= 5
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      Judul kursus sudah diisi (min. 5 karakter)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        formData.description.length >= 50
                          ? "text-[#008A00]"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                    <span
                      className={
                        formData.description.length >= 50
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      Deskripsi sudah diisi (min. 50 karakter)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        formData.categoryId ? "text-[#008A00]" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                    <span
                      className={
                        formData.categoryId
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      Kategori sudah dipilih
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        formData.whatYouWillLearn.filter((w) => w.trim() !== "").length > 0
                          ? "text-[#008A00]"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                    <span
                      className={
                        formData.whatYouWillLearn.filter((w) => w.trim() !== "").length > 0
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      Minimal 1 hal yang akan dipelajari
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        thumbnailPreview ? "text-[#008A00]" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                    <span
                      className={
                        thumbnailPreview
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      Thumbnail sudah diupload
                    </span>
                  </li>
                </ul>

                {/* Tombol Batal dan Simpan Perubahan */}
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
                        Menyimpan Perubahan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </>
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