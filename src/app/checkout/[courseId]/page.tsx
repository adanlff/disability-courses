'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen,
  ArrowLeft,
  Loader2,
  Shield,
  Award,
  Play,
  Users,
  Star,
  Zap,
  Lock,
  Gift
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

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
  mentor: {
    user: {
      full_name: string;
    };
  };
  category: {
    name: string;
  };
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
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
    'BEGINNER': 'Pemula',
    'INTERMEDIATE': 'Menengah',
    'ADVANCED': 'Lanjutan',
    'ALL_LEVEL': 'Semua Level',
  };
  return labels[level] || level;
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}`);

        if (!response.ok) {
          throw new Error('Kursus tidak ditemukan');
        }

        const data = await response.json();
        setCourse(data.course || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Handle payment
  const handlePayment = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/checkout/' + courseId);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat transaksi');
      }

      // If free course, redirect to success
      if (result.is_free) {
        router.push(`/user/courses/${courseId}/success`);
        return;
      }

      // Open Midtrans Snap
      if (result.token && window.snap) {
        window.snap.pay(result.token, {
          onSuccess: () => {
            router.push(`/user/courses/${courseId}/success`);
          },
          onPending: () => {
            router.push(`/user/courses/${courseId}/pending`);
          },
          onError: () => {
            setError('Pembayaran gagal');
          },
          onClose: () => {
            setProcessing(false);
          },
        });
      } else if (result.payment_url) {
        // Fallback to redirect
        window.location.href = result.payment_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 inline-flex mb-4">
              <ShoppingCart className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kursus Tidak Ditemukan</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/courses">
              <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Kursus
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) return null;

  const finalPrice = course.discount_price || course.price;
  const discount = course.discount_price ? course.price - course.discount_price : 0;
  const discountPercent = discount > 0 ? Math.round((discount / course.price) * 100) : 0;

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href={`/courses/${course.slug || course.id}`} 
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#005EB8] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Kembali ke Detail Kursus</span>
              </Link>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Transaksi Aman</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-[#005EB8]" />
              Checkout
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selesaikan pembayaran untuk mengakses kursus
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Course & Benefits */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Details Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                    Detail Pesanan
                  </CardTitle>
                  <CardDescription>Kursus yang akan Anda akses</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Course Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        oleh {course.mentor?.user?.full_name}
                      </p>
                      
                      {/* Course Meta */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-[#005EB8]/10 text-[#005EB8] border-0 pointer-events-none">
                          {course.category?.name}
                        </Badge>
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                          {getLevelLabel(course.level)}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {formatDuration(course.total_duration)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Play className="h-4 w-4" />
                          {course.total_lectures} materi
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Gift className="h-5 w-5 text-[#008A00]" />
                    Yang Anda Dapatkan
                  </CardTitle>
                  <CardDescription>Manfaat yang akan Anda terima dengan kursus ini</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#008A00]/10 flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-[#008A00]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Akses Selamanya</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Belajar kapan saja tanpa batas waktu
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#D93025]/10 flex-shrink-0">
                        <Award className="h-5 w-5 text-[#D93025]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Sertifikat</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dapatkan sertifikat setelah selesai
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#005EB8]/10 flex-shrink-0">
                        <Users className="h-5 w-5 text-[#005EB8]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Komunitas</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Bergabung dengan komunitas belajar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#F4B400]/10 flex-shrink-0">
                        <Zap className="h-5 w-5 text-[#F4B400]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Update Gratis</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Akses materi terbaru secara gratis
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Shield className="h-5 w-5 text-[#005EB8]" />
                    Jaminan Keamanan
                  </CardTitle>
                  <CardDescription>Transaksi Anda aman bersama kami</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Pembayaran Aman</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Diproses oleh Midtrans</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Data Terenkripsi</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SSL 256-bit encryption</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Support 24/7</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bantuan kapan saja</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Payment Summary Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <CreditCard className="h-5 w-5 text-[#005EB8]" />
                      Ringkasan Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Harga Kursus</span>
                        <span className={`text-gray-900 dark:text-white ${discount > 0 ? 'line-through text-gray-400' : ''}`}>
                          {formatCurrency(course.price)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#008A00] flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            Diskon ({discountPercent}%)
                          </span>
                          <span className="text-[#008A00] font-medium">-{formatCurrency(discount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                          {discount > 0 && (
                            <p className="text-xs text-[#008A00]">Anda hemat {formatCurrency(discount)}</p>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-[#005EB8]">
                          {course.is_free ? 'Gratis' : formatCurrency(finalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span className="font-medium">Error:</span> {error}
                        </p>
                      </div>
                    )}

                    {/* Payment Button */}
                    <Button
                      className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handlePayment}
                      disabled={processing || (!snapLoaded && !course.is_free)}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          {course.is_free ? (
                            <>
                              <Zap className="h-5 w-5 mr-2" />
                              Daftar Gratis Sekarang
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5 mr-2" />
                              Bayar Sekarang
                            </>
                          )}
                        </>
                      )}
                    </Button>

                    {/* Terms */}
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                      Dengan melanjutkan, Anda menyetujui{' '}
                      <Link href="/terms" className="text-[#005EB8] hover:underline">
                        Syarat & Ketentuan
                      </Link>{' '}
                      dan{' '}
                      <Link href="/privacy" className="text-[#005EB8] hover:underline">
                        Kebijakan Privasi
                      </Link>{' '}
                      kami.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
