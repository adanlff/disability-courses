'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CreditCard, 
  BookOpen, 
  Loader2,
  AlertCircle,
  Receipt,
  ExternalLink,
  RefreshCw,
  Timer,
  ShieldCheck,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UserLayout from '@/components/user/user-layout';
import ProtectedRoute from '@/components/auth/protected-route';

interface Transaction {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  payment_url: string | null;
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function PaymentPendingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  const fetchTransaction = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions || [];
        const courseTx = transactions.find(
          (tx: Transaction) => tx.course.id === courseId && tx.status === 'PENDING'
        );
        
        if (courseTx) {
          setTransaction(courseTx);
        } else {
          // Check if already enrolled
          const enrollmentRes = await fetch(`/api/users/enrollments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (enrollmentRes.ok) {
            const enrollmentData = await enrollmentRes.json();
            const isEnrolled = enrollmentData.enrollments?.some(
              (e: { course: { id: string } }) => e.course.id === courseId
            );
            
            if (isEnrolled) {
              router.push(`/user/courses/${courseId}/success`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching transaction:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, getAuthToken, router]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      const token = getAuthToken();

      // Verify transaction status
      if (transaction) {
        const response = await fetch(`/api/transactions/verify?order_id=${transaction.order_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'COMPLETED') {
            router.push(`/user/courses/${courseId}/success`);
          } else if (data.status === 'FAILED') {
            router.push(`/user/courses/${courseId}/failed`);
          } else {
            // Refresh transaction data
            await fetchTransaction();
          }
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
    }
  };

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
          {/* Pending Header Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F4B400] to-[#FFCC00] p-8 md:p-12 text-center text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg animate-pulse">
                  <Clock className="h-14 w-14" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Menunggu Pembayaran
                </h1>
                <p className="text-white/90 text-lg md:text-xl">
                  Selesaikan pembayaran untuk mengakses kursus
                </p>
                <Badge className="mt-4 bg-white/20 text-white border-0 text-sm px-4 py-1">
                  <Timer className="h-3.5 w-3.5 mr-1.5" />
                  Berlaku 24 Jam
                </Badge>
              </div>
            </div>
          </Card>

          {transaction ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Transaction Info Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Receipt className="h-5 w-5 text-[#005EB8]" />
                      Detail Transaksi
                    </CardTitle>
                    <CardDescription>Informasi pembayaran Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6 mb-6">
                      <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                        {transaction.course.thumbnail ? (
                          <img
                            src={transaction.course.thumbnail}
                            alt={transaction.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                          {transaction.course.title}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            Order ID: <span className="font-mono text-gray-900 dark:text-white">{transaction.order_id}</span>
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Status: <Badge className="bg-[#F4B400]/10 text-[#F4B400] border-0 ml-1">Menunggu Pembayaran</Badge>
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-[#005EB8] mt-3">
                          {formatCurrency(transaction.total_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {transaction.payment_url && (
                        <a 
                          href={transaction.payment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full h-14 bg-[#005EB8] hover:bg-[#004A93] text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                            <CreditCard className="h-6 w-6 mr-2" />
                            Lanjutkan Pembayaran
                            <ExternalLink className="h-5 w-5 ml-2" />
                          </Button>
                        </a>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full h-12 border-gray-300 dark:border-gray-600"
                        onClick={handleCheckStatus}
                        disabled={checking}
                      >
                        {checking ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-5 w-5 mr-2" />
                        )}
                        Cek Status Pembayaran
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Alert Card */}
                <Card className="rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          Pembayaran Belum Selesai
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Silakan selesaikan pembayaran Anda untuk mengakses kursus. 
                          Pembayaran akan kedaluwarsa dalam 24 jam setelah transaksi dibuat.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Payment Instructions Card */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
                      <HelpCircle className="h-5 w-5 text-[#005EB8]" />
                      Langkah Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#005EB8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          1
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Klik tombol "Lanjutkan Pembayaran"
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#005EB8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          2
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pilih metode pembayaran yang diinginkan
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#005EB8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          3
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Ikuti instruksi pembayaran yang muncul
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#008A00] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Setelah pembayaran selesai, Anda akan mendapat akses kursus
                        </p>
                      </div>
                    </div>
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
                          Pembayaran Aman
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Transaksi Anda diproses dengan aman oleh Midtrans dengan enkripsi SSL 256-bit.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4 space-y-3">
                    <Link href="/user/transaction" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600">
                        <Receipt className="h-4 w-4 mr-3 text-[#008A00]" />
                        Lihat Semua Transaksi
                      </Button>
                    </Link>
                    <Link href="/courses" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 border-gray-300 dark:border-gray-600">
                        <BookOpen className="h-4 w-4 mr-3 text-[#005EB8]" />
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tidak Ada Transaksi Pending
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tidak ada transaksi pending untuk kursus ini
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/user/enrollments">
                    <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                      Lihat Kursus Saya
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" className="border-gray-300 dark:border-gray-600">
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
