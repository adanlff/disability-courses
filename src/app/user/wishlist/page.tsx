"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Search,
  Trash2,
  ShoppingCart,
  Clock,
  Star,
  Users,
  BookOpen,
  Loader2,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/protected-route";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  level: string;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  category: {
    id: string;
    name: string;
  } | null;
  mentor: {
    user: {
      full_name: string;
      avatar: string | null;
    };
  } | null;
  _count: {
    enrollments: number;
    reviews: number;
  };
}

interface WishlistItem {
  id: string;
  course_id: string;
  created_at: string;
  course: Course;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (!minutes) return "0 menit";
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    BEGINNER: "Pemula",
    INTERMEDIATE: "Menengah",
    ADVANCED: "Mahir",
    ALL_LEVELS: "Semua Level",
  };
  return labels[level] || level;
};

export default function UserWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState<WishlistItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  
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
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          return;
        }

        const response = await fetch(`/api/wishlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil wishlist");
        }

        const data = await response.json();
        setWishlist(data.wishlist || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [getAuthToken]);

  // Remove from wishlist
  const handleRemove = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const token = getAuthToken();

      const response = await fetch(
        `/api/wishlist?course_id=${deleteTarget.course_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menghapus dari wishlist");
      }

      setWishlist((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `"${deleteTarget.course.title}" telah dihapus dari wishlist.`
      });
      setShowAlert(true);
      
      setDeleteTarget(null);
      setShowDeleteAlert(false);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan"
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (item: WishlistItem) => {
    setDeleteTarget(item);
    setShowDeleteAlert(true);
  };

  // Filter and sort
  const filteredWishlist = wishlist
    .filter((item) =>
      item.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return (a.course.price || 0) - (b.course.price || 0);
      } else if (sortBy === "price-high") {
        return (b.course.price || 0) - (a.course.price || 0);
      } else if (sortBy === "rating") {
        return (b.course.average_rating || 0) - (a.course.average_rating || 0);
      } else {
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Calculate total
  const totalPrice = filteredWishlist.reduce((sum, item) => {
    if (item.course.is_free) return sum;
    return sum + (item.course.discount_price || item.course.price || 0);
  }, 0);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat wishlist...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
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

        {/* SweetAlert untuk konfirmasi hapus dari wishlist */}
        <SweetAlert
          type="error"
          title="Hapus dari Wishlist?"
          message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.course.title}" dari wishlist?`}
          show={showDeleteAlert}
          onClose={() => {
            setShowDeleteAlert(false);
            setDeleteTarget(null);
          }}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowDeleteAlert(false);
                setDeleteTarget(null);
              }}
              disabled={deleting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleRemove}
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                <Heart className="h-8 w-8 text-[#005EB8]" />
                Wishlist Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kursus yang Anda simpan untuk dibeli nanti
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total:{" "}
                    <span className="font-bold text-[#005EB8]">{wishlist.length}</span>{" "}
                    Kursus
                  </p>
                </CardContent>
              </Card>
              {wishlist.length > 0 && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estimasi:{" "}
                      <span className="font-bold text-[#008A00]">
                        {formatCurrency(totalPrice)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Search & Filter */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Cari di wishlist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[200px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru Ditambahkan</SelectItem>
                    <SelectItem value="price-low">Harga Terendah</SelectItem>
                    <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                    <SelectItem value="rating">Rating Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Wishlist Items */}
          {filteredWishlist.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWishlist.map((item) => (
                <Card
                  key={item.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col group"
                >
                  <div className="relative flex-shrink-0">
                    {item.course.thumbnail ? (
                      <img
                        src={item.course.thumbnail}
                        alt={item.course.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                        {item.course.category?.name || "Kategori"}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                        {getLevelLabel(item.course.level)}
                      </Badge>
                    </div>
                    <button
                      onClick={() => openDeleteConfirmation(item)}
                      className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 text-[#D93025] rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#D93025] hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {item.course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {item.course.mentor?.user?.full_name || "Instruktur"}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {item.course.average_rating > 0 && (
                          <span className="flex items-center gap-1 text-[#F4B400]">
                            <Star className="h-4 w-4 fill-current" />
                            {item.course.average_rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          {item.course._count?.enrollments || 0}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {formatDuration(item.course.total_duration)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        {item.course.is_free || item.course.price === 0 ? (
                          <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">
                            Gratis
                          </Badge>
                        ) : (
                          <div>
                            {item.course.discount_price ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-[#005EB8]">
                                  {formatCurrency(item.course.discount_price)}
                                </span>
                                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                  {formatCurrency(item.course.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-[#005EB8]">
                                {formatCurrency(item.course.price)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/courses/${item.course.slug || item.course.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]" 
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Lihat
                          </Button>
                        </Link>
                        <Link href={`/checkout/${item.course.id}`} className="flex-1">
                          <Button className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white" size="sm">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {item.course.is_free ? "Daftar" : "Beli"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Heart className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm ? "Tidak ada hasil" : "Wishlist kosong"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm
                        ? "Coba kata kunci lain"
                        : "Simpan kursus yang Anda minati untuk dibeli nanti"}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Link href="/courses">
                      <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explore More CTA */}
          {wishlist.length > 0 && (
            <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-white" />
                      <h3 className="text-2xl font-bold text-white">
                        Temukan Lebih Banyak Kursus
                      </h3>
                    </div>
                    <p className="text-white/90">
                      Jelajahi ribuan kursus berkualitas untuk menambah koleksi Anda
                    </p>
                  </div>
                  <Link href="/courses">
                    <Button
                      size="lg"
                      className="bg-white text-[#005EB8] hover:bg-gray-100 font-semibold"
                    >
                      Jelajahi Kursus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}