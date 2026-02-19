"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  BookOpen,
  Calendar,
  Hash,
  Mail,
  FileText,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CertificateTemplateModal } from "@/components/certificates/certificate-modal";

interface Certificate {
  id: string;
  certificate_number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issued_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  pdf_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user: { 
    id: string; 
    full_name: string; 
    email: string; 
    avatar_url?: string;
  };
  course: { 
    id: string; 
    title: string;
    slug: string;
    thumbnail?: string;
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ISSUED":
      return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none"><CheckCircle className="h-3 w-3 mr-1" />Terbit</Badge>;
    case "PENDING":
      return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "REVOKED":
      return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none"><XCircle className="h-3 w-3 mr-1" />Dicabut</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">{status}</Badge>;
  }
};

export default function MentorCertificateDetailPage() {
  const params = useParams();
  const certificateId = params.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", content: "", is_default: false });

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch certificate detail
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        const response = await fetch(`/api/mentor/certificates/${certificateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Sertifikat tidak ditemukan");
          }
          throw new Error("Gagal memuat sertifikat");
        }

        const data = await response.json();
        setCertificate(data.certificate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId, getAuthToken]);

  // Preview certificate - fetches real rendered HTML from API
  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/mentor/certificates/${certificateId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateForm({
          name: certificate?.certificate_number || "Preview Sertifikat",
          content: data.html || "",
          is_default: false,
        });
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data sertifikat...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  if (error || !certificate) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-[#D93025]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error || "Sertifikat tidak ditemukan"}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Silakan kembali ke halaman sertifikat</p>
            <Link href="/mentor/certificates">
              <Button variant="outline" className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Sertifikat
              </Button>
            </Link>
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
            <div className="flex items-center gap-4">
              <Link href="/mentor/certificates">
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
                  <Award className="h-8 w-8 text-[#005EB8]" />
                  Detail Sertifikat
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Nomor: {certificate.certificate_number}
                </p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={previewLoading}
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                Preview
              </Button>
              {certificate.pdf_url && (
                <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white" asChild>
                  <a href={certificate.pdf_url} target="_blank">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Status Banner */}
          <Card className={`rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md ${
            certificate.status === "ISSUED" ? "bg-gradient-to-r from-[#008A00]/10 to-[#008A00]/5 border-[#008A00]/20" :
            certificate.status === "PENDING" ? "bg-gradient-to-r from-[#F4B400]/10 to-[#F4B400]/5 border-[#F4B400]/20" :
            "bg-gradient-to-r from-[#D93025]/10 to-[#D93025]/5 border-[#D93025]/20"
          }`}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    certificate.status === "ISSUED" ? "bg-[#008A00]/10" :
                    certificate.status === "PENDING" ? "bg-[#F4B400]/10" :
                    "bg-[#D93025]/10"
                  }`}>
                    <Award className={`h-6 w-6 ${
                      certificate.status === "ISSUED" ? "text-[#008A00]" :
                      certificate.status === "PENDING" ? "text-[#F4B400]" :
                      "text-[#D93025]"
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Status Sertifikat</h2>
                    <p className={`text-sm ${
                      certificate.status === "ISSUED" ? "text-[#008A00]" :
                      certificate.status === "PENDING" ? "text-[#F4B400]" :
                      "text-[#D93025]"
                    }`}>
                      {certificate.status === "ISSUED" && "Sertifikat telah diterbitkan dan dapat diunduh"}
                      {certificate.status === "PENDING" && "Sertifikat sedang dalam proses pembuatan"}
                      {certificate.status === "REVOKED" && `Sertifikat dicabut: ${certificate.revoke_reason || "Tidak ada alasan"}`}
                    </p>
                  </div>
                </div>
                {getStatusBadge(certificate.status)}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Info */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <User className="h-5 w-5 text-[#005EB8]" />
                  Informasi Siswa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-[#005EB8]/20">
                    <AvatarImage src={certificate.user.avatar_url} />
                    <AvatarFallback className="bg-[#005EB8] text-white text-xl">
                      {certificate.user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{certificate.user.full_name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1 text-sm">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{certificate.user.email}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <BookOpen className="h-5 w-5 text-[#005EB8]" />
                  Informasi Kursus
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {certificate.course.thumbnail ? (
                    <img src={certificate.course.thumbnail} alt={certificate.course.title} className="w-20 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{certificate.course.title}</h3>
                    <Link href={`/mentor/courses/${certificate.course.id}`} className="text-[#005EB8] hover:underline text-sm inline-flex items-center gap-1 mt-1">
                      Lihat Kursus →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 md:col-span-2">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <FileText className="h-5 w-5 text-[#005EB8]" />
                  Detail Sertifikat
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-0">
                  <div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4" /> Nomor Sertifikat
                      </span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-sm">{certificate.certificate_number}</span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" /> Dibuat
                      </span>
                      <span className="text-gray-900 dark:text-white text-sm">{formatDate(certificate.created_at)}</span>
                    </div>
                    {certificate.issued_at && (
                      <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 md:border-b-0">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4" /> Diterbitkan
                        </span>
                        <span className="text-gray-900 dark:text-white text-sm">{formatDate(certificate.issued_at)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Terakhir Diupdate</span>
                      <span className="text-gray-900 dark:text-white text-sm">{formatDate(certificate.updated_at)}</span>
                    </div>
                    {certificate.revoked_at && (
                      <>
                        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4" /> Dicabut Pada
                          </span>
                          <span className="text-gray-900 dark:text-white text-sm">{formatDate(certificate.revoked_at)}</span>
                        </div>
                        <div className="flex items-center justify-between py-4">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Alasan Pencabutan</span>
                          <span className="text-[#D93025] text-sm">{certificate.revoke_reason || "-"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal - using shared component with real certificate data */}
        <CertificateTemplateModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          type="preview"
          template={null}
          templateForm={templateForm}
          loading={previewLoading}
          onFormChange={() => {}}
          onFileUpload={() => {}}
          onSave={() => {}}
        />
      </MentorLayout>
    </ProtectedRoute>
  );
}