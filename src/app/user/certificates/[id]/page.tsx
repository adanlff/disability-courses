"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Hash,
  Calendar,
  User,
  Share2,
  Printer,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { PreviewCertificateModal } from "@/components/certificates/preview-certificate-modal";
import { ShareCertificateModal } from "@/components/certificates/share-certificate-modal";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    mentor: {
      user: { full_name: string };
    };
  };
  user: {
    id: string;
    full_name: string;
    email: string;
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
      return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none text-base px-4 py-2"><CheckCircle className="h-4 w-4 mr-2" />Tersedia</Badge>;
    case "PENDING":
      return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none text-base px-4 py-2"><Clock className="h-4 w-4 mr-2" />Menunggu</Badge>;
    case "REVOKED":
      return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none text-base px-4 py-2"><XCircle className="h-4 w-4 mr-2" />Dicabut</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">{status}</Badge>;
  }
};

export default function UserCertificateDetailPage() {
  const params = useParams();
  const certificateId = params.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState("");

  // Modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch certificate detail
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        const response = await fetch(`/api/users/certificates/${certificateId}`, {
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

        // Also fetch the preview HTML
        const previewResponse = await fetch(`/api/users/certificates/${certificateId}/preview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          setPreviewContent(previewData.html || "");
        }
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

  // Preview certificate
  const handlePreview = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/users/certificates/${certificateId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.html || "");
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error("Preview error:", err);
    }
  };

  // Print certificate
  const handlePrint = () => {
    if (previewContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sertifikat - ${certificate?.certificate_number}</title>
              <style>
                body { margin: 0; padding: 0; }
                @media print {
                  @page { size: landscape; margin: 0; }
                }
              </style>
            </head>
            <body>
              ${previewContent}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      // Jika previewContent belum dimuat, buka modal preview dulu
      handlePreview();
    }
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

  if (error || !certificate) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-[#D93025] mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error || "Sertifikat tidak ditemukan"}
            </h2>
            <Link href="/user/certificates">
              <Button 
                variant="outline" 
                className="mt-4 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Sertifikat
              </Button>
            </Link>
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
          <div className="flex items-center gap-4">
            <Link href="/user/certificates">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Award className="h-8 w-8 text-[#005EB8]" />
                Sertifikat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {certificate.course.title}
              </p>
            </div>
          </div>

          {/* Certificate Display */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Status */}
            <CardContent className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-[#005EB8]" />
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{certificate.course.title}</h2>
                    <p className="text-sm text-gray-500">No: {certificate.certificate_number}</p>
                  </div>
                </div>
                {getStatusBadge(certificate.status)}
              </div>
            </CardContent>

            {/* Rendered Certificate Template */}
            {previewContent ? (
              <div className="bg-white">
                <iframe 
                  srcDoc={previewContent} 
                  className="w-full border-0" 
                  style={{ minHeight: '500px', height: 'auto' }}
                  title="Sertifikat"
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#005EB8] mx-auto mb-4" />
                <p className="text-gray-500">Memuat template sertifikat...</p>
              </div>
            )}

            <CardContent className="p-6 border-t border-gray-200 dark:border-gray-700">
              {/* Certificate Details */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Hash className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nomor Sertifikat</p>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{certificate.certificate_number}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Terbit</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {certificate.issued_at ? formatDate(certificate.issued_at) : "-"}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <User className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mentor</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {certificate.course.mentor.user.full_name}
                  </p>
                </div>
              </div>

              {/* Revoked Warning */}
              {certificate.status === "REVOKED" && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-[#D93025]/20 dark:border-[#D93025]/30 rounded-lg p-4 mb-8 text-center">
                  <XCircle className="h-8 w-8 text-[#D93025] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#D93025] dark:text-[#D93025] mb-1">
                    Sertifikat Dicabut
                  </h4>
                  <p className="text-sm text-[#D93025]/80 dark:text-[#D93025]">
                    {certificate.revoke_reason || "Hubungi admin untuk informasi lebih lanjut"}
                  </p>
                  {certificate.revoked_at && (
                    <p className="text-xs text-[#D93025] mt-2">
                      Dicabut pada: {formatDate(certificate.revoked_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Pending Info */}
              {certificate.status === "PENDING" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-[#F4B400]/20 dark:border-[#F4B400]/30 rounded-lg p-4 mb-8 text-center">
                  <Clock className="h-8 w-8 text-[#F4B400] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#F4B400] dark:text-[#F4B400] mb-1">
                    Sertifikat Dalam Proses
                  </h4>
                  <p className="text-sm text-[#F4B400]/80 dark:text-[#F4B400]">
                    Sertifikat Anda sedang dalam proses pembuatan. Silakan cek kembali nanti.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {certificate.status === "ISSUED" && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewModalOpen(true)} 
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  {certificate.pdf_url && (
                    <Button 
                      className="bg-[#005EB8] hover:bg-[#004A93] text-white" 
                      asChild
                    >
                      <a 
                        href={certificate.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setShareModalOpen(true)} 
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePrint} 
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Cetak
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Info */}
          <Card className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#005EB8]" />
                <div>
                  <h4 className="font-semibold text-[#005EB8] dark:text-[#005EB8]">
                    Verifikasi Sertifikat
                  </h4>
                  <p className="text-sm text-[#005EB8]/80 dark:text-[#005EB8]">
                    Sertifikat ini dapat diverifikasi keasliannya melalui nomor sertifikat:{" "}
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {certificate.certificate_number}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Modal */}
        <PreviewCertificateModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          previewContent={previewContent}
          pdfUrl={certificate.pdf_url}
          onPrint={handlePrint}
          certificateNumber={certificate.certificate_number}
        />

        {/* Share Modal */}
        <ShareCertificateModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          certificateNumber={certificate.certificate_number}
          courseTitle={certificate.course.title}
        />
      </UserLayout>
    </ProtectedRoute>
  );
}