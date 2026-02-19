'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Filter, 
  X, 
  Loader2,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Play,
  User
} from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Mentor {
  id: string;
  headline: string;
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
  total_students: number;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  total_reviews: number;
  category: Category;
  mentor: Mentor;
  created_at: string;
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/courses/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '50');
      params.append('sort', sortBy);
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (selectedType === 'free') params.append('is_free', 'true');
      if (selectedType === 'paid') params.append('is_free', 'false');

      const response = await fetch(`/api/courses?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data kursus');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedLevel, selectedType, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedType('all');
    setSortBy('newest');
  };

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'all' || selectedLevel !== 'all' || selectedType !== 'all' || searchTerm !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat kursus...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#005EB8]/10 via-[#008A00]/5 to-[#F4B400]/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005EB8]/10 text-[#005EB8] text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Temukan Kursus Terbaik
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Jelajahi Kursus
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Temukan kursus yang sesuai dengan minat dan kebutuhan Anda dari instruktur terbaik
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari kursus, topik, atau instruktur..."
                className="pl-12 h-14 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#005EB8]/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCourses} className="border-red-300 text-red-600 hover:bg-red-100">
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter Section */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#005EB8]/10">
                  <SlidersHorizontal className="h-4 w-4 text-[#005EB8]" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Filter Kursus
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#005EB8] dark:text-gray-400 dark:hover:text-[#005EB8] transition-colors"
                >
                  <X className="h-4 w-4" />
                  Reset Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kategori
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:ring-[#005EB8]">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tingkat
                </label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:ring-[#005EB8]">
                    <SelectValue placeholder="Semua Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tingkat</SelectItem>
                    <SelectItem value="BEGINNER">Pemula</SelectItem>
                    <SelectItem value="INTERMEDIATE">Menengah</SelectItem>
                    <SelectItem value="ADVANCED">Mahir</SelectItem>
                    <SelectItem value="ALL_LEVELS">Semua Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipe
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:ring-[#005EB8]">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="free">Gratis</SelectItem>
                    <SelectItem value="paid">Berbayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Urutkan
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:ring-[#005EB8]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="popular">Terpopuler</SelectItem>
                    <SelectItem value="rating">Rating Tertinggi</SelectItem>
                    <SelectItem value="price_low">Harga Terendah</SelectItem>
                    <SelectItem value="price_high">Harga Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count & Active Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{courses.length}</span> kursus
          </p>
          
          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <Badge className="bg-[#005EB8]/10 text-[#005EB8] border-0 flex items-center gap-1 px-3 py-1">
                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLevel !== 'all' && (
              <Badge className="bg-[#F4B400]/10 text-[#F4B400] border-0 flex items-center gap-1 px-3 py-1">
                {getLevelLabel(selectedLevel)}
                <button onClick={() => setSelectedLevel('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge className="bg-[#008A00]/10 text-[#008A00] border-0 flex items-center gap-1 px-3 py-1">
                {selectedType === 'free' ? 'Gratis' : 'Berbayar'}
                <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200 dark:border-gray-700 overflow-hidden group"
              >
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 rounded-full bg-white/90">
                        <Play className="h-6 w-6 text-[#005EB8] fill-[#005EB8]" />
                      </div>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${(course.is_free || course.price === 0) ? 'bg-[#008A00]' : 'bg-[#005EB8]'} text-white border-0 shadow-md`}>
                        {(course.is_free || course.price === 0) ? 'Gratis' : 'Berbayar'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[#005EB8]/10 text-[#005EB8] border-0 pointer-events-none">
                      {course.category?.name || 'Kategori'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                      {getLevelLabel(course.level)}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-[#005EB8] transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {course.short_description || course.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{course.mentor?.user?.full_name || 'Instruktur'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(course.total_duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.total_students}</span>
                    </div>
                    {course.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-auto">
                  <div className="text-xl font-bold text-[#005EB8]">
                    {(course.is_free || course.price === 0) ? 'Gratis' : formatCurrency(course.discount_price || course.price)}
                  </div>
                  <Link href={`/courses/${course.slug || course.id}`}>
                    <Button className="bg-[#005EB8] hover:bg-[#004A93] group/btn">
                      Lihat Detail
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex mb-4">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Tidak ada kursus
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {hasActiveFilters 
                  ? 'Tidak ada kursus yang sesuai dengan filter yang dipilih. Coba ubah atau reset filter Anda.'
                  : 'Belum ada kursus yang tersedia saat ini. Silakan cek kembali nanti.'}
              </p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="outline" className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10">
                  <X className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}