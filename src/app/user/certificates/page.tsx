  "use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Search,
  Loader2,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Share2,
  ExternalLink,
  GraduationCap,
  Trophy,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import Link from "next/link";

interface Certificate {
  id: string;
  certificate_number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issued_at: string | null;
  pdf_url: string | null;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    mentor: {
      user: { full_name: string };
    };
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ISSUED":
      return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none"><CheckCircle className="h-3 w-3 mr-1" />Tersedia</Badge>;
    case "PENDING":
      return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
    case "REVOKED":
      return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none"><XCircle className="h-3 w-3 mr-1" />Dicabut</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">{status}</Badge>;
  }
};

export default function UserCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch certificates
  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch(`/api/users/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat sertifikat");

      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Filter certificates
  const filteredCertificates = certificates.filter(cert =>
    cert.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === "ISSUED").length,
    pending: certificates.filter(c => c.status === "PENDING").length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Award className="h-8 w-8 text-[#005EB8]" />
                Sertifikat Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat dan unduh sertifikat kursus yang telah Anda selesaikan
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />{error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Trophy className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tersedia</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.issued}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Clock className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Cari sertifikat berdasarkan judul kursus atau nomor..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Certificates Grid */}
          {filteredCertificates.length === 0 ? (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12">
                <div className="text-center">
                  <GraduationCap className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Sertifikat</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Selesaikan kursus untuk mendapatkan sertifikat
                  </p>
                  <Link href="/user/courses">
                    <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Lihat Kursus Saya
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <Card 
                  key={cert.id} 
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-[#005EB8] to-[#004A93]">
                    {cert.course.thumbnail ? (
                      <img 
                        src={cert.course.thumbnail} 
                        alt={cert.course.title} 
                        className="w-full h-full object-cover opacity-30" 
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Award className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-sm opacity-75">SERTIFIKAT</p>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(cert.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">{cert.course.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Mentor: {cert.course.mentor.user.full_name}
                    </p>
                    <div className="text-xs text-gray-400 mb-4 space-y-1">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {cert.issued_at ? `Terbit: ${formatDate(cert.issued_at)}` : `Dibuat: ${formatDate(cert.created_at)}`}
                      </p>
                      <p className="font-mono text-gray-600 dark:text-gray-300">No: {cert.certificate_number}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/user/certificates/${cert.id}`} className="flex-1">
                        {/* Button Lihat - Style diubah seperti button Lihat Semua di dashboard */}
                        <Button 
                          variant="outline" 
                          className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      </Link>
                      {cert.status === "ISSUED" && cert.pdf_url && (
                        <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white" size="sm" asChild>
                          <a href={cert.pdf_url} target="_blank" download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Banner */}
          {stats.issued > 0 && (
            <Card className="rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-[#008A00]" />
                  <div>
                    <h4 className="font-semibold text-[#008A00] dark:text-[#008A00]">Selamat!</h4>
                    <p className="text-sm text-[#008A00]/80 dark:text-[#008A00]">
                      Anda memiliki {stats.issued} sertifikat yang sudah tersedia untuk diunduh. 
                      Sertifikat dapat digunakan sebagai bukti kompetensi dan dibagikan ke LinkedIn atau media sosial lainnya.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}