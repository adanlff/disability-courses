"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  BookOpen,
  User,
  Calendar,
  Edit3,
  MessageSquare,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    mentor: { user: { full_name: string } };
  };
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function EditReview() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) { setError("Silakan login terlebih dahulu"); return; }
        
        const response = await fetch(`/api/users/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Review tidak ditemukan");
        
        const data = await response.json();
        setReview(data.review);
        setRating(data.review.rating);
        setComment(data.review.comment || "");
        setIsAnonymous(data.review.is_anonymous);
      } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
      finally { setLoading(false); }
    };
    
    if (reviewId) fetchReview();
  }, [reviewId, getAuthToken]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(`/api/users/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment: comment.trim() || null, is_anonymous: isAnonymous }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan review");
      }

      setSuccess("Review berhasil diperbarui");
      setTimeout(() => router.push("/user/reviews"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan review");
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (r: number) => {
    const labels = ["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"];
    return labels[r] || "";
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Memuat review...</p>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  if (!review) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Edit3 className="h-8 w-8 text-[#005EB8]" />
                Edit Review
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Perbarui review Anda</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Button 
              variant="outline" 
              asChild
              className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
            >
              <Link href="/user/reviews">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
            </div>
          </div>

          {/* Error Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-[#D93025]/10 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-[#D93025]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Review Tidak Ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {error || "Review yang Anda cari tidak dapat ditemukan atau mungkin sudah dihapus."}
                  </p>
                </div>
                <Link href="/user/reviews">
                  <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Review Saya
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/user/reviews">
              <Button 
                variant="outline" 
                size="icon"
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-3">
                <Edit3 className="h-8 w-8 text-[#005EB8]" />
                Edit Review
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Perbarui review Anda untuk kursus ini</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rating Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Star className="h-5 w-5 text-[#F4B400]" />
                    Rating
                  </CardTitle>
                  <CardDescription>Berikan penilaian Anda untuk kursus ini</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#005EB8] rounded"
                        >
                          <Star
                            className={`h-12 w-12 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "text-[#F4B400] fill-[#F4B400]"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Badge className={`px-4 py-1 text-sm pointer-events-none ${
                      (hoverRating || rating) >= 4 
                        ? "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20"
                        : (hoverRating || rating) >= 3
                          ? "bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20"
                          : "bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20"
                    }`}>
                      {getRatingLabel(hoverRating || rating)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Comment Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <MessageSquare className="h-5 w-5 text-[#005EB8]" />
                    Komentar
                  </CardTitle>
                  <CardDescription>Bagikan pengalaman Anda mengikuti kursus ini (opsional)</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ceritakan pengalaman Anda, apa yang Anda sukai, dan saran untuk perbaikan..."
                    rows={6}
                    className="resize-none border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{comment.length}/1000 karakter</span>
                    <span>Sisa {1000 - comment.length} karakter</span>
                  </div>
                </CardContent>
              </Card>

              {/* Anonymous Toggle Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isAnonymous ? 'bg-[#005EB8]/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {isAnonymous ? 
                          <EyeOff className="h-6 w-6 text-[#005EB8]" /> : 
                          <Eye className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Review Anonim</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isAnonymous ? "Nama Anda tidak akan ditampilkan pada review" : "Review akan menampilkan nama lengkap Anda"}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={isAnonymous} 
                      onCheckedChange={setIsAnonymous}
                      className="data-[state=checked]:bg-[#005EB8]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/user/reviews")} 
                  className="flex-1 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-[#005EB8] hover:bg-[#004A93] text-white" 
                  disabled={saving}
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

            {/* Right Sidebar - Course Info */}
            <div className="space-y-6">
              {/* Course Info Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                    Informasi Kursus
                  </CardTitle>
                  <CardDescription>Detail kursus yang di-review</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                      {review.course.thumbnail ? (
                        <img
                          src={review.course.thumbnail}
                          alt={review.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                        {review.course.title}
                      </h3>
                      
                      <div className="space-y-0">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Mentor</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {review.course.mentor.user.full_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Rating Saat Ini</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400]" />
                            <span className="font-medium text-gray-900 dark:text-white">{review.rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Ditinjau</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Course Link */}
                    <Link href={`/courses/${review.course.slug}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Lihat Detail Kursus
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/5 to-[#005EB8]/10 border-[#005EB8]/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#005EB8]/10 flex-shrink-0">
                      <Star className="h-5 w-5 text-[#005EB8]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tips Menulis Review</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Jelaskan apa yang Anda pelajari</li>
                        <li>• Sebutkan kelebihan kursus</li>
                        <li>• Berikan saran konstruktif</li>
                        <li>• Bersikap jujur dan objektif</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}