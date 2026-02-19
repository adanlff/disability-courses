"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  Calendar,
  BookOpen,
  Filter,
  StarOff,
  User,
  Award,
} from "lucide-react";
import Image from "next/image";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  course: {
    id: string;
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Pagination {
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

const RatingStars = ({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
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

export default function MentorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch courses for filter
  const fetchCourses = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/mentors/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, [getAuthToken]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
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

      const response = await fetch(`/api/mentors/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data ulasan");

      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Filter reviews locally
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      (review.comment?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      review.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || review.course.id === courseFilter;
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesCourse && matchesRating;
  });

  // Calculate stats
  const totalReviews = pagination.total;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful_count, 0);

  if (loading && reviews.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
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
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Star className="h-8 w-8 text-[#005EB8]" />
                Ulasan Kursus
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat ulasan dan feedback dari siswa Anda
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Ulasan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Star className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rating Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Award className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rating 5 Bintang</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fiveStarCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <ThumbsUp className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Helpful</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHelpful}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <p className="text-[#D93025] dark:text-[#D93025]">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Reviews Table Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <MessageSquare className="h-5 w-5 text-[#005EB8]" />
                    Daftar Ulasan
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {filteredReviews.length} ulasan ditemukan
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
                      placeholder="Cari ulasan berdasarkan nama, komentar, atau kursus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Kursus" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all" className="truncate">
                        Semua Kursus
                      </SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id} className="truncate">
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-full md:w-[150px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                      <Star className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="all" className="truncate">
                        Semua Rating
                      </SelectItem>
                      {[5, 4, 3, 2, 1].map((r) => (
                        <SelectItem key={r} value={r.toString()} className="truncate">
                          <div className="flex items-center gap-2">
                            <RatingStars rating={r} size="sm" />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <StarOff className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Ulasan</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || courseFilter !== "all" || ratingFilter !== "all"
                      ? "Tidak ada ulasan yang cocok dengan filter"
                      : "Ulasan akan muncul setelah siswa memberikan review"}
                  </p>
                  {(searchTerm || courseFilter !== "all" || ratingFilter !== "all") && (
                    <Button 
                      variant="outline"
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                      onClick={() => {
                        setSearchTerm("");
                        setCourseFilter("all");
                        setRatingFilter("all");
                      }}
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile & Tablet View - Cards */}
                  <div className="block lg:hidden p-4 space-y-4">
                    {filteredReviews.map((review) => (
                      <Card key={review.id} className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          {/* Header: User & Rating */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {review.is_anonymous ? (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                  </div>
                                ) : review.user.avatar_url ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                    <Image
                                      src={review.user.avatar_url.startsWith("/") ? `/api${review.user.avatar_url}` : review.user.avatar_url}
                                      alt={review.user.full_name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold">
                                    {review.user.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {review.is_anonymous ? "Anonim" : review.user.full_name}
                                </p>
                                {review.is_anonymous && (
                                  <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs">
                                    Anonim
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <RatingStars rating={review.rating} size="sm" />
                          </div>

                          {/* Course */}
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {review.course.title}
                            </p>
                          </div>

                          {/* Comment */}
                          <div className="mb-3">
                            {review.comment ? (
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                {review.comment}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                                Tidak ada komentar
                              </p>
                            )}
                          </div>

                          {/* Footer: Helpful & Date */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpful_count} helpful</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(review.created_at)}
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
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[180px] px-4 py-3">
                          Siswa
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[180px] px-4 py-3">
                          Kursus
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Rating
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-3">
                          Komentar
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[100px] px-4 py-3 text-center">
                          Helpful
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-[120px] px-4 py-3">
                          Tanggal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {review.is_anonymous ? (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                  </div>
                                ) : review.user.avatar_url ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                    <Image
                                      src={review.user.avatar_url.startsWith("/") ? `/api${review.user.avatar_url}` : review.user.avatar_url}
                                      alt={review.user.full_name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold">
                                    {review.user.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate" title={review.is_anonymous ? "Anonim" : review.user.full_name}>
                                  {review.is_anonymous ? "Anonim" : review.user.full_name}
                                </p>
                                {review.is_anonymous && (
                                  <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs mt-1">
                                    Anonim
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white truncate flex items-center gap-1" title={review.course.title}>
                                {review.course.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex justify-center">
                              <RatingStars rating={review.rating} size="sm" />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="min-w-0 max-w-[300px]">
                              {review.comment ? (
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" title={review.comment}>
                                  {review.comment}
                                </p>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada komentar</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>{review.helpful_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(review.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
                  </div>
                </>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Halaman {pagination.page} dari {pagination.totalPages} • Total {totalReviews} ulasan
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}