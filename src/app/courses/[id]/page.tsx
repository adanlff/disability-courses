'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  ArrowLeft,
  Globe,
  Calendar,
  Heart,
  Share2,
  Loader2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShareCourseModal } from '@/components/courses/share-course-modal';

// ... (semua interface dan helper functions tetap sama, TIDAK DIUBAH) ...

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MentorUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio?: string;
}

interface Mentor {
  id: string;
  headline: string;
  bio?: string;
  expertise: string[];
  average_rating: number;
  total_students: number;
  total_courses: number;
  user: MentorUser;
}

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration: number;
  order: number;
  is_free: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration: number;
  materials: Material[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  price: number;
  discount_price?: number | null;
  is_free: boolean;
  level: string;
  language: string;
  total_students: number;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  total_reviews: number;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  created_at: string;
  updated_at: string;
  category: Category;
  mentor: Mentor;
  sections: Section[];
  reviews: Review[];
  _count?: {
    sections: number;
    enrollments: number;
    reviews: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    BEGINNER: 'Pemula',
    INTERMEDIATE: 'Menengah',
    ADVANCED: 'Mahir',
    ALL_LEVELS: 'Semua Level',
  };
  return labels[level] || level;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Share modal state - HANYA INI YANG DIUBAH
  const [showShareModal, setShowShareModal] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch course data - TIDAK DIUBAH
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/courses/${courseId}`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Kursus tidak ditemukan');
          }
          throw new Error('Gagal mengambil data kursus');
        }

        const data = await response.json();
        setCourse(data.course || data);
        setIsEnrolled(data.isEnrolled || false);
        
        // Expand first section by default
        if (data.course?.sections?.[0]) {
          setExpandedSections(new Set([data.course.sections[0].id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, getAuthToken]);

  // Handle enroll - TIDAK DIUBAH
  const handleEnroll = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    // For both free and paid courses, redirect directly to checkout
    // The checkout page will handle the enrollment logic (free enrollment or payment)
    router.push(`/checkout/${course?.id}`);
  };

  // Toggle section expansion - TIDAK DIUBAH
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(Array.from(prev));
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Check if in wishlist - TIDAK DIUBAH
  useEffect(() => {
    const checkWishlist = async () => {
      const token = getAuthToken();
      if (!token || !course?.id) return;

      try {
        const response = await fetch(`/api/wishlist/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setInWishlist(data.inWishlist);
        }
      } catch {
        // Ignore errors
      }
    };

    checkWishlist();
  }, [course?.id, getAuthToken]);

  // Toggle wishlist - TIDAK DIUBAH
  const handleWishlistToggle = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    try {
      setWishlistLoading(true);

      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?course_id=${course?.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setInWishlist(false);
        }
      } else {
        // Add to wishlist
        const response = await fetch(`/api/wishlist`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ course_id: course?.id }),
        });
        if (response.ok) {
          setInWishlist(true);
        }
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // HAPUS SEMUA FUNGSI SHARE DI SINI karena sudah dipindah ke komponen modal

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat kursus...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Kursus tidak ditemukan'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Kursus yang Anda cari tidak tersedia
            </p>
            <Link href="/courses">
              <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Katalog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMaterials = course.sections?.reduce((acc, s) => acc + s.materials.length, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/courses" className="flex items-center gap-2 text-gray-600 hover:text-[#005EB8] dark:text-gray-400 dark:hover:text-[#005EB8] transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Katalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-[#005EB8]/10 text-[#005EB8] border-0 pointer-events-none">
                  {course.category?.name || 'Kategori'}
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  {getLevelLabel(course.level)}
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(course.total_duration)}
                </Badge>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                {course.title}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {course.short_description || course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                {course.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{course.average_rating.toFixed(1)}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ({course.total_reviews} ulasan)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                  {course.total_students.toLocaleString()} siswa
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5" />
                  Update: {formatDate(course.updated_at)}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe className="h-5 w-5" />
                  {course.language === 'id' ? 'Bahasa Indonesia' : course.language}
                </div>
              </div>

              {/* Instructor Card */}
              {course.mentor && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-600">
                        <AvatarImage src={course.mentor.user?.avatar_url || ''} />
                        <AvatarFallback className="bg-[#005EB8] text-white text-lg font-semibold">
                          {course.mentor.user?.full_name?.[0] || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Instruktur</p>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          {course.mentor.user?.full_name || 'Instruktur'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                          {course.mentor.headline || course.mentor.bio}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1 rounded bg-yellow-100 dark:bg-yellow-900/30">
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            </div>
                            <span>{course.mentor.average_rating?.toFixed(1) || '0'}/5.0</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1 rounded bg-[#005EB8]/10">
                              <BookOpen className="h-3.5 w-3.5 text-[#005EB8]" />
                            </div>
                            <span>{course.mentor.total_courses || 0} Kursus</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="p-1 rounded bg-[#008A00]/10">
                              <GraduationCap className="h-3.5 w-3.5 text-[#008A00]" />
                            </div>
                            <span>{(course.mentor.total_students || 0).toLocaleString()} Siswa</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enrollment Card */}
            <div>
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 sticky top-24">
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#005EB8] mb-2">
                      {course.is_free ? 'Gratis' : formatCurrency(course.discount_price || course.price)}
                    </div>
                    {!course.is_free && course.discount_price && course.discount_price < course.price && (
                      <div className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        {formatCurrency(course.price)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {isEnrolled ? (
                      <Link href={`/user/courses/${course.id}/player`}>
                        <Button className="w-full bg-[#005EB8] hover:bg-[#004A93] h-12 text-base font-semibold" size="lg">
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Lanjutkan Belajar
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-[#005EB8] hover:bg-[#004A93] h-12 text-base font-semibold" 
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-5 w-5" />
                            {course.is_free ? 'Daftar Sekarang' : 'Beli Sekarang'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Simpan & Bagikan buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className={`flex-1 h-11 ${
                        inWishlist 
                          ? 'border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]' 
                          : 'border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]'
                      }`}
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                    >
                      {wishlistLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Heart className={`h-4 w-4 mr-2 ${inWishlist ? 'fill-[#D93025]' : ''}`} />
                      )}
                      {inWishlist ? 'Tersimpan' : 'Simpan'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Bagikan
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      Kursus ini mencakup:
                    </p>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#005EB8]/10">
                          <PlayCircle className="h-4 w-4 text-[#005EB8]" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{formatDuration(course.total_duration)} video on-demand</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#F4B400]/10">
                          <BookOpen className="h-4 w-4 text-[#F4B400]" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{totalMaterials} materi pembelajaran</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#008A00]/10">
                          <Globe className="h-4 w-4 text-[#008A00]" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">Akses seumur hidup</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#D93025]/10">
                          <Award className="h-4 w-4 text-[#D93025]" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">Sertifikat kelulusan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="curriculum" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded-xl h-auto">
            <TabsTrigger value="curriculum" className="py-2.5 rounded-lg data-[state=active]:bg-[#005EB8] data-[state=active]:text-white font-medium">
              Kurikulum
            </TabsTrigger>
            <TabsTrigger value="overview" className="py-2.5 rounded-lg data-[state=active]:bg-[#005EB8] data-[state=active]:text-white font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="reviews" className="py-2.5 rounded-lg data-[state=active]:bg-[#005EB8] data-[state=active]:text-white font-medium">
              Ulasan
            </TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                      <BookOpen className="h-5 w-5 text-[#005EB8]" />
                      Konten Kursus
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {course.sections?.length || 0} section • {totalMaterials} materi • {formatDuration(course.total_duration)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {course.sections && course.sections.length > 0 ? (
                  course.sections.map((section) => (
                    <Card key={section.id} className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#005EB8] rounded-xl flex items-center justify-center text-white text-sm font-bold">
                            {section.order}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {section.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {section.materials.length} materi • {formatDuration(section.duration)}
                            </p>
                          </div>
                        </div>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {expandedSections.has(section.id) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                          {section.materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <PlayCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {material.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {material.type} • {formatDuration(material.duration)}
                                </p>
                              </div>
                              {material.is_free && (
                                <Badge className="bg-[#008A00] text-white border-0 pointer-events-none">Gratis</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Konten</h3>
                    <p className="text-gray-500 dark:text-gray-400">Konten kursus akan segera tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                    Deskripsi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {course.what_you_will_learn && course.what_you_will_learn.length > 0 && (
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <CheckCircle2 className="h-5 w-5 text-[#008A00]" />
                        Yang akan Anda pelajari
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid gap-3">
                        {course.what_you_will_learn.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-[#008A00] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Award className="h-5 w-5 text-[#F4B400]" />
                        Persyaratan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-3">
                        {course.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-2 h-2 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Star className="h-5 w-5 text-[#F4B400]" />
                  Ulasan Siswa
                </CardTitle>
                <CardDescription>
                  {course.total_reviews} ulasan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {course.average_rating > 0 && (
                  <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/5 to-[#005EB8]/10 border-[#005EB8]/20 dark:border-[#005EB8]/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-gray-900 dark:text-white">
                            {course.average_rating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 mt-2 justify-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-6 w-6 ${
                                  i < Math.floor(course.average_rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-300 text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {course.total_reviews} ulasan
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {course.reviews.map((review) => (
                      <Card key={review.id} className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.user?.avatar_url || ''} />
                              <AvatarFallback className="bg-[#005EB8] text-white">
                                {review.user?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {review.user?.full_name || 'Pengguna'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(review.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-300 text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-gray-700 dark:text-gray-300">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Ulasan</h3>
                    <p className="text-gray-500 dark:text-gray-400">Jadilah yang pertama memberikan ulasan!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Course Modal */}
      <ShareCourseModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        course={course}
      />
    </div>
  );
}