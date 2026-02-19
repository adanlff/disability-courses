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
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Code,
  Edit,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";
import { CertificateTemplateModal } from "@/components/certificates/certificate-modal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination"; // Import komponen pagination

interface Certificate {
  id: string;
  certificate_number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issued_at: string | null;
  pdf_url: string | null;
  created_at: string;
  user: { id: string; full_name: string; email: string };
  course: { id: string; title: string };
}

interface Template {
  id: string;
  key: string;
  value: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; text-align: center; padding: 60px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
    .certificate { border: 8px solid #005EB8; padding: 60px; background: white; max-width: 800px; margin: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .header { font-size: 42px; color: #005EB8; margin-bottom: 20px; font-weight: bold; }
    .subtitle { font-size: 18px; color: #666; margin-bottom: 40px; }
    .recipient { font-size: 32px; color: #333; margin: 30px 0; font-style: italic; }
    .course { font-size: 24px; color: #005EB8; margin: 20px 0; font-weight: bold; }
    .date { font-size: 14px; color: #888; margin-top: 40px; }
    .signature { margin-top: 60px; border-top: 2px solid #333; width: 200px; margin-left: auto; margin-right: auto; padding-top: 10px; }
    .signature img { max-height: 60px; }
    .cert-number { font-size: 12px; color: #aaa; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">SERTIFIKAT</div>
    <div class="subtitle">Dengan bangga diberikan kepada</div>
    <div class="recipient">{{STUDENT_NAME}}</div>
    <p>Telah berhasil menyelesaikan kursus</p>
    <div class="course">{{COURSE_TITLE}}</div>
    <p>dengan mentor {{MENTOR_NAME}}</p>
    <div class="date">Diterbitkan pada {{ISSUED_DATE}}</div>
    <div class="signature">
      {{SIGNATURE_IMAGE}}
      <p>{{MENTOR_NAME}}</p>
    </div>
    <div class="cert-number">No. Sertifikat: {{CERTIFICATE_NUMBER}}</div>
  </div>
</body>
</html>`;

export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState("certificates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "preview">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: DEFAULT_TEMPLATE,
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  
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

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch certificates
  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`/api/admin/certificates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat sertifikat");

      const data = await response.json();
      setCertificates(data.certificates || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, filterStatus]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/certificates/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat template");

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoadingTemplates(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
  }, [fetchCertificates, fetchTemplates]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get status badge
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

  // Parse template
  const parseTemplate = (template: Template) => {
    try {
      return JSON.parse(template.value);
    } catch {
      return { name: "Unknown", content: "", is_default: false };
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTemplateForm(prev => ({ 
        ...prev, 
        content, 
        name: file.name.replace(".html", "").replace(".htm", "") 
      }));
    };
    reader.readAsText(file);
  };

  // Open create modal
  const openCreateModal = () => {
    setSelectedTemplate(null);
    setModalType("create");
    setTemplateForm({ name: "", content: DEFAULT_TEMPLATE, is_default: false });
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (template: Template) => {
    const parsed = parseTemplate(template);
    setSelectedTemplate(template);
    setModalType("edit");
    setTemplateForm({ 
      name: parsed.name, 
      content: parsed.content, 
      is_default: parsed.is_default 
    });
    setModalOpen(true);
  };

  // Open preview modal
  const openPreviewModal = (template: Template) => {
    const parsed = parseTemplate(template);
    setSelectedTemplate(template);
    setModalType("preview");
    setTemplateForm({ 
      name: parsed.name, 
      content: parsed.content, 
      is_default: parsed.is_default 
    });
    setModalOpen(true);
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: "Nama dan konten template wajib diisi"
      });
      setShowAlert(true);
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      const url = modalType === "edit" && selectedTemplate
        ? `/api/admin/certificates/templates/${selectedTemplate.id}`
        : `/api/admin/certificates/templates`;

      const response = await fetch(url, {
        method: modalType === "edit" ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan template");
      }

      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: modalType === "edit" ? "Template berhasil diperbarui" : "Template berhasil dibuat"
      });
      setShowAlert(true);
      
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal menyimpan template"
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/certificates/templates/${selectedTemplate.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal menghapus template");

      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: "Template berhasil dihapus"
      });
      setShowAlert(true);
      
      setShowDeleteAlert(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal menghapus template"
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (template: Template) => {
    setSelectedTemplate(template);
    setShowDeleteAlert(true);
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    const blob = new Blob([templateForm.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateForm.name || 'template'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = {
    total: pagination.total,
    issued: certificates.filter(c => c.status === "ISSUED").length,
    pending: certificates.filter(c => c.status === "PENDING").length,
    templates: templates.length,
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
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

        {/* SweetAlert untuk konfirmasi hapus template */}
        <SweetAlert
          type="error"
          title="Hapus Template?"
          message="Tindakan ini tidak dapat dibatalkan. Template akan dihapus permanen."
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0}
          showCloseButton={true}
        >
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteAlert(false)}
              disabled={saving}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteTemplate}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {saving ? (
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

        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Award className="h-8 w-8 text-[#005EB8]" />
                Manajemen Sertifikat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola sertifikat dan template sertifikat platform
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-[#D93025] flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />{error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#005EB8]/10">
                    <Award className="h-5 w-5 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sertifikat</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#008A00]/10">
                    <CheckCircle className="h-5 w-5 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Terbit</p>
                    <p className="text-2xl font-bold text-[#008A00]">{stats.issued}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#F4B400]/10">
                    <Clock className="h-5 w-5 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-[#F4B400]">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#D93025]/10">
                    <FileText className="h-5 w-5 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Template</p>
                    <p className="text-2xl font-bold text-[#D93025]">{stats.templates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="certificates">Daftar Sertifikat</TabsTrigger>
              <TabsTrigger value="templates">Template Sertifikat</TabsTrigger>
            </TabsList>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              {/* Certificates Table Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Award className="h-5 w-5 text-[#005EB8]" />
                        Daftar Sertifikat
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Total {pagination.total} sertifikat
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
                          placeholder="Cari sertifikat..." 
                          value={searchTerm} 
                          onChange={(e) => setSearchTerm(e.target.value)} 
                          className="pl-10 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600" 
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="ISSUED">Terbit</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="REVOKED">Dicabut</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <Award className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Sertifikat</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sertifikat akan muncul setelah siswa menyelesaikan kursus
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50">
                            <th className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[220px] px-4 py-3 text-left">Siswa</th>
                            <th className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[200px] px-4 py-3 text-left">Kursus</th>
                            <th className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[180px] px-4 py-3 text-left">No. Sertifikat</th>
                            <th className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[110px] px-4 py-3 text-left">Tanggal</th>
                            <th className="font-semibold text-gray-700 dark:text-gray-300 text-sm w-[110px] px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {certificates.map((cert) => (
                            <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-t border-gray-100 dark:border-gray-800">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-[#005EB8]/10 flex items-center justify-center flex-shrink-0">
                                    <Award className="h-5 w-5 text-[#005EB8]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={cert.user.full_name}>
                                      {cert.user.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={cert.user.email}>
                                      {cert.user.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate" title={cert.course.title}>
                                    {cert.course.title}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-0">
                                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded border dark:border-gray-700 text-gray-600 dark:text-gray-400 break-all">
                                    {cert.certificate_number}
                                  </code>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(cert.created_at)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center">
                                  {getStatusBadge(cert.status)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination - Diganti dengan komponen Pagination */}
                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.limit}
                      onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                      loading={loading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Template Sertifikat</CardTitle>
                      <CardDescription>Upload dan kelola template HTML sertifikat</CardDescription>
                    </div>
                    <Button onClick={openCreateModal} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Template</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Buat template sertifikat pertama Anda</p>
                      <Button onClick={openCreateModal} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Template
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map((template) => {
                        const parsed = parseTemplate(template);
                        return (
                          <Card key={template.id} className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-[#005EB8]" />
                                  <h4 className="font-medium text-gray-900 dark:text-white">{parsed.name}</h4>
                                </div>
                                {parsed.is_default && <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Default</Badge>}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Dibuat: {formatDate(template.created_at)}</p>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openPreviewModal(template)}
                                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                                >
                                  <Eye className="h-4 w-4 mr-1" />Preview
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openEditModal(template)}
                                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                                >
                                  <Edit className="h-4 w-4 mr-1" />Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openDeleteConfirmation(template)}
                                  className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Variables Info */}
                  <Card className="mt-6 rounded-lg border bg-[#005EB8]/10 dark:bg-[#005EB8]/20 border-[#005EB8]/20 dark:border-[#005EB8]/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-[#005EB8] dark:text-[#005EB8] mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Variabel Template
                      </h4>
                      <p className="text-sm text-[#005EB8]/80 dark:text-[#005EB8] mb-2">
                        Gunakan variabel berikut dalam template HTML:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{STUDENT_NAME}}"}</code>
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{COURSE_TITLE}}"}</code>
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{MENTOR_NAME}}"}</code>
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{ISSUED_DATE}}"}</code>
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{CERTIFICATE_NUMBER}}"}</code>
                        <code className="bg-white/50 dark:bg-gray-800 px-2 py-1 rounded text-[#005EB8]">{"{{SIGNATURE_IMAGE}}"}</code>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Certificate Template Modal */}
        <CertificateTemplateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          type={modalType}
          template={selectedTemplate}
          templateForm={templateForm}
          loading={saving}
          onFormChange={(field, value) => setTemplateForm(prev => ({ ...prev, [field]: value }))}
          onFileUpload={handleFileUpload}
          onSave={handleSaveTemplate}
          onDownload={modalType === "preview" ? handleDownloadTemplate : undefined}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}