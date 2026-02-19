'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  RefreshCw, 
  BookOpen, 
  ArrowLeft,
  HelpCircle,
  CreditCard,
  AlertTriangle,
  MessageCircle,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import UserLayout from '@/components/user/user-layout';
import ProtectedRoute from '@/components/auth/protected-route';

export default function PaymentFailedPage() {
  const params = useParams();
  const courseId = params.id as string;

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'ADMIN']}>
      <UserLayout>
        <div className="space-y-8">
          {/* Failed Header Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D93025] to-[#FF4444] p-8 md:p-12 text-center text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
                  <XCircle className="h-14 w-14" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Pembayaran Gagal
                </h1>
                <p className="text-white/90 text-lg md:text-xl">
                  Terjadi kesalahan saat memproses pembayaran
                </p>
                <Badge className="mt-4 bg-white/20 text-white border-0 text-sm px-4 py-1">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Transaksi Tidak Berhasil
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Error Info Card */}
              <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="pb-3 border-b border-red-200 dark:border-red-800">
                  <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200 text-lg font-bold">
                    <AlertTriangle className="h-5 w-5" />
                    Kemungkinan Penyebab
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Saldo Tidak Mencukupi</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Pastikan saldo atau limit kartu Anda cukup untuk melakukan pembayaran</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Transaksi Dibatalkan</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Anda mungkin membatalkan transaksi sebelum selesai</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                        <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Waktu Pembayaran Habis</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Pembayaran tidak selesai dalam batas waktu yang ditentukan</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Masalah Teknis</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Terjadi kesalahan pada sistem pembayaran</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <RefreshCw className="h-5 w-5 text-[#005EB8]" />
                    Langkah Selanjutnya
                  </CardTitle>
                  <CardDescription>Pilih tindakan yang ingin Anda lakukan</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Link href={`/checkout/${courseId}`} className="block">
                      <Button className="w-full h-14 bg-[#005EB8] hover:bg-[#004A93] text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                        <RefreshCw className="h-6 w-6 mr-2" />
                        Coba Bayar Lagi
                      </Button>
                    </Link>

                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/courses" className="block">
                        <Button variant="outline" className="w-full h-12 border-gray-300 dark:border-gray-600">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Kembali
                        </Button>
                      </Link>
                      <Link href="/user/enrollments" className="block">
                        <Button variant="outline" className="w-full h-12 border-gray-300 dark:border-gray-600">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Kursus Saya
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Help Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
                    <HelpCircle className="h-5 w-5 text-[#005EB8]" />
                    Butuh Bantuan?
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Jika masalah berlanjut, tim support kami siap membantu Anda.
                  </p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600">
                      <MessageCircle className="h-4 w-4 mr-3 text-[#008A00]" />
                      Hubungi Support
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
                    <ShieldCheck className="h-5 w-5 text-[#008A00]" />
                    Tips Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                      <span>Pastikan koneksi internet stabil saat melakukan pembayaran</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                      <span>Coba gunakan metode pembayaran lain jika tersedia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                      <span>Selesaikan pembayaran dalam waktu yang ditentukan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                      <span>Periksa saldo atau limit kartu kredit Anda</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Secure Payment Card */}
              <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/5 to-[#005EB8]/10 border-[#005EB8]/20 dark:border-[#005EB8]/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#005EB8]/10">
                      <ShieldCheck className="h-5 w-5 text-[#005EB8]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        Transaksi Aman
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Uang Anda tidak akan terpotong jika pembayaran gagal. Silakan coba lagi dengan aman.
                      </p>
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
