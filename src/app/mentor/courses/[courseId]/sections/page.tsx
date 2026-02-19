"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { SectionModal } from "@/components/modal/section-modal";
import { MaterialModal } from "@/components/modal/material-modal";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

type MaterialType = "VIDEO" | "DOCUMENT" | "QUIZ" | "ASSIGNMENT";
type VideoStatus = "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  content: string | null;
  video_id: string | null;
  document_url: string | null;
  duration: number;
  order: number;
  is_free: boolean;
  video?: {
    id: string;
    status: VideoStatus;
    path: string;
  };
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number;
  materials: Material[];
  _count?: {
    materials: number;
  };
}

interface Course {
  id: string;
  title: string;
  status: string;
  slug: string;
}

export default function SectionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  const [savingSection, setSavingSection] = useState(false);

  // Material dialog state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    type: "VIDEO" as MaterialType,
    content: "",
    youtube_url: "",
    duration: 0,
    is_free: false,
  });
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Video upload state
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // Document upload state
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

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
  const [deleteTarget, setDeleteTarget] = useState<{ type: "section" | "material"; id: string; sectionId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch course and sections
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!courseResponse.ok) {
        throw new Error("Gagal mengambil data kursus");
      }

      const courseResult = await courseResponse.json();
      setCourse(courseResult.data || courseResult.course || courseResult);

      // Fetch sections
      const sectionsResponse = await fetch(`/api/courses/${courseId}/sections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!sectionsResponse.ok) {
        throw new Error("Gagal mengambil data section");
      }

      const sectionsResult = await sectionsResponse.json();
      setSections(sectionsResult.sections || []);

      // Expand all sections by default
      if (sectionsResult.sections) {
        const sectionIds = sectionsResult.sections.map((s: Section) => s.id);
        setExpandedSections(new Set(sectionIds));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [courseId, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if course is editable
  const isEditable = course?.status === "DRAFT";

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Open section dialog
  const openSectionDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({ title: section.title, description: section.description || "" });
    } else {
      setEditingSection(null);
      setSectionForm({ title: "", description: "" });
    }
    setSectionDialogOpen(true);
  };

  // Save section
  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: "Judul section wajib diisi"
      });
      setShowAlert(true);
      return;
    }

    try {
      setSavingSection(true);
      const token = getAuthToken();

      if (editingSection) {
        // Update existing section
        const response = await fetch(`/api/sections/${editingSection.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sectionForm),
        });

        if (!response.ok) throw new Error("Gagal memperbarui section");

        setSections((prev) =>
          prev.map((s) =>
            s.id === editingSection.id
              ? { ...s, title: sectionForm.title, description: sectionForm.description }
              : s
          )
        );

        setAlertConfig({
          type: "success",
          title: "Berhasil",
          message: "Section berhasil diperbarui"
        });
        setShowAlert(true);
      } else {
        // Create new section
        const response = await fetch(`/api/courses/${courseId}/sections`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: sectionForm.title.trim(),
            description: sectionForm.description?.trim() || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Gagal membuat section");
        }

        const result = await response.json();
        setSections((prev) => [...prev, result.section]);
        setExpandedSections((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.add(result.section.id);
          return newSet;
        });

        setAlertConfig({
          type: "success",
          title: "Berhasil",
          message: "Section berhasil dibuat"
        });
        setShowAlert(true);
      }

      setSectionDialogOpen(false);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan"
      });
      setShowAlert(true);
    } finally {
      setSavingSection(false);
    }
  };

  // Open material dialog
  const openMaterialDialog = (sectionId: string, material?: Material) => {
    setSelectedSectionId(sectionId);
    if (material) {
      setEditingMaterial(material);
      setMaterialForm({
        title: material.title,
        description: material.description || "",
        type: material.type,
        content: material.content || "",
        youtube_url: (material as Material & { youtube_url?: string }).youtube_url || "",
        duration: material.duration,
        is_free: material.is_free,
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm({
        title: "",
        description: "",
        type: "VIDEO",
        content: "",
        youtube_url: "",
        duration: 0,
        is_free: false,
      });
    }
    setSelectedVideoFile(null);
    setUploadProgress(0);
    setMaterialDialogOpen(true);
  };

  // Handle form change for material modal
  const handleMaterialFormChange = (field: string, value: any) => {
    setMaterialForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save material
  const handleSaveMaterial = async () => {
    if (!materialForm.title.trim() || !selectedSectionId) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: "Judul materi wajib diisi"
      });
      setShowAlert(true);
      return;
    }

    try {
      setSavingMaterial(true);
      const token = getAuthToken();

      // Upload document if DOCUMENT type and file selected
      let documentUrl: string | null = null;
      if (materialForm.type === "DOCUMENT" && selectedDocumentFile) {
        try {
          setUploadingDocument(true);
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedDocumentFile);
          
          const uploadResponse = await fetch(`/api/uploads/documents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: uploadFormData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            if (uploadResult.success && uploadResult.data?.url) {
              documentUrl = uploadResult.data.url;
            }
          }
        } catch (uploadError) {
          console.error('Document upload error:', uploadError);
        } finally {
          setUploadingDocument(false);
        }
      }

      const materialData = {
        title: materialForm.title,
        description: materialForm.description || null,
        type: materialForm.type,
        content: materialForm.type === "DOCUMENT" ? documentUrl : (materialForm.content || null),
        document_url: documentUrl,
        youtube_url: materialForm.type === "VIDEO" ? (materialForm.youtube_url || null) : null,
        duration: materialForm.duration,
        is_free: materialForm.is_free,
      };

      if (editingMaterial) {
        // Update existing material
        const response = await fetch(`/api/materials/${editingMaterial.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) throw new Error("Gagal memperbarui materi");

        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSectionId
              ? {
                  ...s,
                  materials: s.materials.map((m) =>
                    m.id === editingMaterial.id ? { ...m, ...materialData } : m
                  ),
                }
              : s
          )
        );

        setAlertConfig({
          type: "success",
          title: "Berhasil",
          message: "Materi berhasil diperbarui"
        });
        setShowAlert(true);
      } else {
        // Create new material
        const response = await fetch(`/api/sections/${selectedSectionId}/materials`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materialData),
        });

        if (!response.ok) throw new Error("Gagal membuat materi");

        const result = await response.json();
        const newMaterial = result.material;

        // If video type and file selected, upload video
        if (materialForm.type === "VIDEO" && selectedVideoFile) {
          await uploadVideoForMaterial(newMaterial.id);
        }

        setSections((prev) =>
          prev.map((s) =>
            s.id === selectedSectionId
              ? { ...s, materials: [...s.materials, newMaterial] }
              : s
          )
        );

        setAlertConfig({
          type: "success",
          title: "Berhasil",
          message: "Materi berhasil dibuat"
        });
        setShowAlert(true);
      }

      setMaterialDialogOpen(false);
      setSelectedDocumentFile(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan"
      });
      setShowAlert(true);
    } finally {
      setSavingMaterial(false);
    }
  };

  // Upload video for material
  const uploadVideoForMaterial = async (materialId: string) => {
    if (!selectedVideoFile) return;

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", selectedVideoFile);
      formData.append("material_id", materialId);

      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload gagal"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload gagal"));
        });

        xhr.open("POST", `/api/videos/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      // Refresh sections to get updated video status
      await fetchData();
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal upload video"
      });
      setShowAlert(true);
    } finally {
      setUploadingVideo(false);
      setSelectedVideoFile(null);
    }
  };

  // Open delete confirmation
  const openDeleteDialog = (type: "section" | "material", id: string, sectionId?: string) => {
    setDeleteTarget({ type, id, sectionId });
    setShowDeleteAlert(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const token = getAuthToken();

      const endpoint =
        deleteTarget.type === "section"
          ? `/api/sections/${deleteTarget.id}`
          : `/api/materials/${deleteTarget.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Gagal menghapus ${deleteTarget.type}`);

      if (deleteTarget.type === "section") {
        setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setExpandedSections((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(deleteTarget.id);
          return newSet;
        });
      } else {
        setSections((prev) =>
          prev.map((s) =>
            s.id === deleteTarget.sectionId
              ? { ...s, materials: s.materials.filter((m) => m.id !== deleteTarget.id) }
              : s
          )
        );
      }

      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: deleteTarget.type === "section" ? "Section berhasil dihapus" : "Materi berhasil dihapus"
      });
      setShowAlert(true);
      
      setShowDeleteAlert(false);
      setDeleteTarget(null);
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

  // Get material type icon
  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4" />;
      case "ASSIGNMENT":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get material type label
  const getMaterialTypeLabel = (type: MaterialType) => {
    const labels: Record<MaterialType, string> = {
      VIDEO: "Video",
      DOCUMENT: "Dokumen",
      QUIZ: "Kuis",
      ASSIGNMENT: "Tugas",
    };
    return labels[type];
  };

  // Get video status badge
  const getVideoStatusBadge = (status?: VideoStatus) => {
    if (!status) return null;
    switch (status) {
      case "UPLOADING":
        return <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">Uploading</Badge>;
      case "PROCESSING":
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Processing</Badge>;
      case "COMPLETED":
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Ready</Badge>;
      case "FAILED":
        return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none">Failed</Badge>;
      default:
        return null;
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
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

        {/* SweetAlert untuk konfirmasi hapus */}
        <SweetAlert
          type="error"
          title={deleteTarget?.type === "section" ? "Hapus Section?" : "Hapus Materi?"}
          message={
            deleteTarget?.type === "section"
              ? "Semua materi dalam section ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
              : "Tindakan ini tidak dapat dibatalkan."
          }
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
              onClick={handleDelete}
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
            <div className="flex items-center gap-4">
              <Link href="/mentor/courses">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Layers className="h-8 w-8 text-[#005EB8]" />
                  Kelola Konten
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {course?.title || "Memuat..."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3">
              {!isEditable && (
                <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Tidak dapat diedit (Status: {course?.status})
                </Badge>
              )}
              <Link href={`/mentor/courses/${courseId}/edit`}>
                <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Kursus
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Add Section Button */}
          {isEditable && (
            <Button
              onClick={() => openSectionDialog()}
              className="bg-[#005EB8] hover:bg-[#004A93] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Section
            </Button>
          )}

          {/* Sections List */}
          <div className="space-y-4">
            {sections.length === 0 ? (
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Belum ada konten
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Gunakan tombol "Tambah Section" di atas untuk mulai menambahkan konten
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sections.map((section, sectionIndex) => (
                <Card
                  key={section.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleSection(section.id)}
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                          <div>
                            <CardTitle className="text-lg text-gray-900 dark:text-white">
                              Section {sectionIndex + 1}: {section.title}
                            </CardTitle>
                            {section.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                          {section.materials.length} materi
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                          {formatDuration(section.duration)}
                        </Badge>
                        {isEditable && (
                          <>
                            {/* Button Edit di header section */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSectionDialog(section)}
                              className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Button Hapus di header section */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                              onClick={() => openDeleteDialog("section", section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections.has(section.id) && (
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-2 ml-8">
                        {section.materials.map((material, materialIndex) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#005EB8]/10 dark:bg-[#005EB8]/20 flex items-center justify-center">
                                {getMaterialIcon(material.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {materialIndex + 1}. {material.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{getMaterialTypeLabel(material.type)}</span>
                                  {material.duration > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDuration(material.duration)}</span>
                                    </>
                                  )}
                                  {material.is_free && (
                                    <>
                                      <span>•</span>
                                      <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none text-xs py-0">Gratis</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {material.type === "VIDEO" && material.video && (
                                getVideoStatusBadge(material.video.status)
                              )}
                              {material.type === "QUIZ" && (
                                <Link href={`/mentor/courses/${courseId}/materials/${material.id}/quiz`}>
                                  {/* Button Kelola Quiz - Style diubah seperti button Lihat Semua di dashboard */}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                  >
                                    <HelpCircle className="h-4 w-4 mr-1" />
                                    Kelola Quiz
                                  </Button>
                                </Link>
                              )}
                              {isEditable && (
                                <>
                                  {/* Button Edit di setiap material */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openMaterialDialog(section.id, material)}
                                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {/* Button Hapus di setiap material */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                                    onClick={() => openDeleteDialog("material", material.id, section.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add Material Button */}
                        {isEditable && (
                          <Button
                            variant="outline"
                            className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                            onClick={() => openMaterialDialog(section.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Materi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Section Modal */}
        <SectionModal
          open={sectionDialogOpen}
          onOpenChange={setSectionDialogOpen}
          title={sectionForm.title}
          description={sectionForm.description}
          isEditing={!!editingSection}
          loading={savingSection}
          onTitleChange={(value) => setSectionForm((prev) => ({ ...prev, title: value }))}
          onDescriptionChange={(value) => setSectionForm((prev) => ({ ...prev, description: value }))}
          onSave={handleSaveSection}
        />

        {/* Material Modal */}
        <MaterialModal
          open={materialDialogOpen}
          onOpenChange={setMaterialDialogOpen}
          formData={materialForm}
          selectedVideoFile={selectedVideoFile}
          selectedDocumentFile={selectedDocumentFile}
          isEditing={!!editingMaterial}
          loading={savingMaterial}
          uploadingVideo={uploadingVideo}
          uploadingDocument={uploadingDocument}
          uploadProgress={uploadProgress}
          onFormChange={handleMaterialFormChange}
          onVideoFileSelect={setSelectedVideoFile}
          onDocumentFileSelect={setSelectedDocumentFile}
          onSave={handleSaveMaterial}
        />
      </MentorLayout>
    </ProtectedRoute>
  );
}