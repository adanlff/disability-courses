'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Play, 
  BookOpen, 
  ArrowRight,
  Loader2,
  PartyPopper,
  Receipt,
  Award,
  Clock,
  Users,
  Sparkles,
  Gift
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UserLayout from '@/components/user/user-layout';
import ProtectedRoute from '@/components/auth/protected-route';

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  total_duration?: number;
  total_lectures?: number;
  mentor: {
    user: {
      full_name: string;
    };
  } | null;
}

interface Enrollment {
  id: string;
  status: string;
  created_at: string;
  course: Course;
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 menit';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

export default function PurchaseSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  useEffect(() => {
    const verifyPaymentAndEnroll = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        if (!token) {
          router.push('/login');
          return;
        }

        // First, get the transaction for this course to verify payment
        const transactionResponse = await fetch(`/api/transactions/verify?course_id=${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (transactionResponse.ok) {
          const transactionData = await transactionResponse.json();
          
          // If there's a pending transaction with order_id, verify it from Midtrans
          if (transactionData.transaction && transactionData.transaction.order_id) {
            const orderId = transactionData.transaction.order_id;
            
            // Check payment status from Midtrans and update
            const verifyResponse = await fetch(`/api/payments/notification?order_id=${orderId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('Payment verification result:', verifyData);
              
              // If payment expired, show error and don't continue
              if (verifyData.expired) {
                setError('Waktu pembayaran sudah habis. Silakan lakukan pembelian kursus kembali.');
                setLoading(false);
                return;
              }
              
              // If payment failed/cancelled, show error
              if (verifyData.failed) {
                setError('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
                setLoading(false);
                return;
              }
            }
          }
        }

        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now check if user is enrolled
        const response = await fetch(`/api/users/enrollments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const enrollments = data.enrollments || [];
          const courseEnrollment = enrollments.find(
            (e: Enrollment) => e.course.id === courseId || e.course?.id === courseId
          );

          if (courseEnrollment) {
            setEnrollment(courseEnrollment);
          } else {
            // If not enrolled, try to get course info
            const courseResponse = await fetch(`/api/courses/${courseId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              setEnrollment({
                id: '',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                course: courseData.course || courseData,
              });
            } else {
              setError('Tidak dapat menemukan informasi kursus');
            }
          }
        }
      } catch (err) {
        console.error('Error checking enrollment:', err);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    verifyPaymentAndEnroll();
  }, [courseId, getAuthToken, router]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'ADMIN']}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'ADMIN']}>
      <UserLayout>
        <div className="space-y-8">
          {/* Success Header Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-[#008A00] to-[#00B300] p-8 md:p-12 text-center text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <PartyPopper className="h-7 w-7" />
                  <h1 className="text-3xl md:text-4xl font-bold">Selamat!</h1>
                  <PartyPopper className="h-7 w-7" />
                </div>
                <p className="text-white/90 text-lg md:text-xl">
                  Pendaftaran kursus berhasil
                </p>
                <Badge className="mt-4 bg-white/20 text-white border-0 text-sm px-4 py-1">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Akses Seumur Hidup
                </Badge>
              </div>
            </div>
          </Card>

          {error ? (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 inline-flex mb-4">
                  <BookOpen className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <Link href="/user/enrollments">
                  <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    Lihat Kursus Saya
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : enrollment ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Course Info Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <BookOpen className="h-5 w-5 text-[#005EB8]" />
                      Kursus Anda
                    </CardTitle>
                    <CardDescription>Kursus yang baru saja Anda daftarkan</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                        {enrollment.course.thumbnail ? (
                          <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          oleh {enrollment.course.mentor?.user?.full_name || 'Mentor'}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {enrollment.course.total_duration && (
                            <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              {formatDuration(enrollment.course.total_duration)}
                            </Badge>
                          )}
                          {enrollment.course.total_lectures && (
                            <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              {enrollment.course.total_lectures} materi
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link href={`/user/courses/${courseId}/player`} className="block mt-6">
                      <Button className="w-full h-14 bg-[#005EB8] hover:bg-[#004A93] text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                        <Play className="h-6 w-6 mr-2" />
                        Mulai Belajar Sekarang
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Gift className="h-5 w-5 text-[#F4B400]" />
                      Tips untuk Memulai
                    </CardTitle>
                    <CardDescription>Saran agar pembelajaran Anda lebih efektif</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-[#008A00]/10 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-[#008A00]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Ikuti Secara Berurutan</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ikuti materi secara berurutan untuk hasil pembelajaran yang maksimal
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-[#005EB8]/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-[#005EB8]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Gunakan Fitur Diskusi</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tanyakan jika ada materi yang kurang dipahami
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-[#D93025]/10 flex-shrink-0">
                          <Award className="h-5 w-5 text-[#D93025]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Selesaikan untuk Sertifikat</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Selesaikan semua materi untuk mendapatkan sertifikat kelulusan
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
                      Aksi Cepat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <Link href="/user/enrollments" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <BookOpen className="h-4 w-4 mr-3 text-[#005EB8]" />
                        Kursus Saya
                      </Button>
                    </Link>
                    <Link href="/user/transaction" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Receipt className="h-4 w-4 mr-3 text-[#008A00]" />
                        Riwayat Transaksi
                      </Button>
                    </Link>
                    <Link href="/user/certificates" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Award className="h-4 w-4 mr-3 text-[#D93025]" />
                        Sertifikat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Explore More Card */}
                <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/5 to-[#005EB8]/10 border-[#005EB8]/20 dark:border-[#005EB8]/30">
                  <CardContent className="p-5">
                    <div className="text-center">
                      <div className="p-3 rounded-xl bg-[#005EB8]/10 inline-flex mb-3">
                        <Sparkles className="h-6 w-6 text-[#005EB8]" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Jelajahi Kursus Lainnya
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Temukan kursus menarik lainnya untuk meningkatkan skill Anda
                      </p>
                      <Link href="/courses">
                        <Button className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white">
                          Jelajahi Kursus
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Data enrollment tidak ditemukan
                </p>
                <Link href="/user/enrollments">
                  <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    Lihat Kursus Saya
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}
