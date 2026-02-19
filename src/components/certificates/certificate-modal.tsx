"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Code, Eye, Download, FileText, Check, AlertCircle, Copy, Globe } from "lucide-react";

interface Template {
  id: string;
  key: string;
  value: string;
  created_at: string;
}

interface CertificateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "edit" | "preview";
  template?: Template | null;
  templateForm: {
    name: string;
    content: string;
    is_default: boolean;
  };
  loading: boolean;
  onFormChange: (field: string, value: any) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onDownload?: () => void;
}

// Template variabel untuk referensi
const TEMPLATE_VARIABLES = [
  { variable: "{{STUDENT_NAME}}", description: "Nama siswa" },
  { variable: "{{COURSE_TITLE}}", description: "Judul kursus" },
  { variable: "{{MENTOR_NAME}}", description: "Nama mentor" },
  { variable: "{{ISSUED_DATE}}", description: "Tanggal penerbitan" },
  { variable: "{{CERTIFICATE_NUMBER}}", description: "Nomor sertifikat" },
  { variable: "{{SIGNATURE_IMAGE}}", description: "Gambar tanda tangan" },
  { variable: "{{COMPLETION_DATE}}", description: "Tanggal penyelesaian" },
  { variable: "{{GRADE}}", description: "Nilai/grade" },
  { variable: "{{DURATION}}", description: "Durasi kursus" },
];

// Format tanggal untuk preview
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function CertificateTemplateModal({
  open,
  onOpenChange,
  type,
  template,
  templateForm,
  loading,
  onFormChange,
  onFileUpload,
  onSave,
  onDownload,
}: CertificateTemplateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  if (!open) return null;

  // Konten untuk preview dengan data dummy
  const previewContent = templateForm.content
    .replace(/\{\{STUDENT_NAME\}\}/g, "John Doe")
    .replace(/\{\{COURSE_TITLE\}\}/g, "Web Development Masterclass")
    .replace(/\{\{MENTOR_NAME\}\}/g, "Jane Smith")
    .replace(/\{\{ISSUED_DATE\}\}/g, formatDate(new Date().toISOString()))
    .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, "CERT-2024-001")
    .replace(/\{\{SIGNATURE_IMAGE\}\}/g, "")
    .replace(/\{\{COMPLETION_DATE\}\}/g, formatDate(new Date().toISOString()))
    .replace(/\{\{GRADE\}\}/g, "A+ (98%)")
    .replace(/\{\{DURATION\}\}/g, "30 jam");

  const handleInsertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = templateForm.content.substring(0, start) + variable + templateForm.content.substring(end);
      onFormChange("content", newText);
      
      // Set focus kembali ke textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  if (type === "preview") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
        <Card
          className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - compact */}
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preview Template
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pratinjau template sertifikat dengan data contoh
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Konten utama - compact height with scroll */}
          <div className="flex-1 overflow-y-auto">
            <CardContent className="p-5 space-y-5">
              {/* Notifikasi - compact */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Catatan Preview
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Ini adalah preview dengan data dummy. Variabel seperti tanda tangan mungkin tidak ditampilkan secara visual dalam preview ini.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Container - compact */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Preview Template
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Preview: {templateForm.name || "Unnamed Template"}
                    </p>
                  </div>
                  <iframe 
                    srcDoc={previewContent} 
                    className="w-full h-[400px] border-0"
                    title="Template Preview"
                    sandbox="allow-same-origin"
                  />
                </Card>
              </div>

              {/* Informasi Template - compact */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Detail Template
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nama Template</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {templateForm.name || "Unnamed Template"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ukuran Konten</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {templateForm.content.length} karakter
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tombol aksi - compact layout */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    Download HTML
                  </button>
                )}
                
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
                >
                  Tutup
                </button>
              </div>
            </CardContent>
          </div>

          {/* Footer - compact */}
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Template ID: {template?.id || "New"} • Terakhir diperbarui: {template ? formatDate(template.created_at) : "Baru"}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <Card
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {type === "edit" ? "Edit Template" : "Buat Template Baru"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type === "edit" 
                    ? "Perbarui template sertifikat HTML Anda" 
                    : "Buat template sertifikat HTML baru atau upload file HTML"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Konten utama - compact height with scroll */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-5">
            {/* Variabel Template - compact */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <Code className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Variabel Template
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Klik variabel untuk menyisipkannya ke editor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  {showVariables ? "Sembunyikan" : "Lihat Semua"}
                </button>
              </div>
              
              {showVariables ? (
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {TEMPLATE_VARIABLES.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2.5 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div>
                            <button
                              type="button"
                              onClick={() => handleInsertVariable(item.variable)}
                              className="text-left group"
                            >
                              <code className="text-[11px] font-mono text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                {item.variable}
                              </code>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.description}
                              </p>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyVariable(item.variable)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="Salin variabel"
                          >
                            {copiedVariable === item.variable ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.slice(0, 5).map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleInsertVariable(item.variable)}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium rounded-md border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {item.variable}
                        </button>
                      ))}
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 self-center">
                        + {TEMPLATE_VARIABLES.length - 5} lainnya...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Form Input - compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nama Template */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => onFormChange("name", e.target.value)}
                  placeholder="Contoh: Template Default"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  autoFocus
                />
              </div>

              {/* Upload File - compact */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Upload File HTML
                </label>
                <Card className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <CardContent className="p-4 text-center relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,.htm"
                      onChange={onFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                      Klik atau drag file HTML ke sini
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      File harus berformat .html atau .htm
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                      Pilih File
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Template Default - compact */}
            <div className="flex items-start gap-2.5 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <input
                type="checkbox"
                id="is_default"
                checked={templateForm.is_default}
                onChange={(e) => onFormChange("is_default", e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 mt-0.5"
              />
              <div>
                <label htmlFor="is_default" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block">
                  Jadikan template default
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Template default akan digunakan untuk semua sertifikat baru secara otomatis
                </p>
              </div>
            </div>

            {/* Quick Actions - compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const defaultTemplate = `<!DOCTYPE html>
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
                  onFormChange("content", defaultTemplate);
                }}
                className="border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-md">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Gunakan Template Default
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Template standar dengan desain profesional untuk sertifikat kursus
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onFormChange("content", "");
                  onFormChange("name", "Template Kosong");
                }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Mulai dari Kosong
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Buat template dari nol dengan kode HTML Anda sendiri
                </p>
              </button>
            </div>

            {/* Editor HTML - compact */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Konten HTML <span className="text-red-500">*</span>
                  </h3>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.select();
                      }
                    }}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Pilih Semua
                  </button>
                </div>
              </div>
              
              <textarea
                name="content"
                value={templateForm.content}
                onChange={(e) => onFormChange("content", e.target.value)}
                rows={10}
                className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Paste atau tulis kode HTML template di sini..."
              />
              
              <div className="flex justify-between items-center mt-1.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {templateForm.content.length} karakter
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const iframeContent = templateForm.content
                      .replace(/\{\{STUDENT_NAME\}\}/g, "John Doe")
                      .replace(/\{\{COURSE_TITLE\}\}/g, "Web Development")
                      .replace(/\{\{MENTOR_NAME\}\}/g, "Jane Smith")
                      .replace(/\{\{ISSUED_DATE\}\}/g, formatDate(new Date().toISOString()))
                      .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, "CERT-PREVIEW-001");
                    
                    const previewWindow = window.open();
                    if (previewWindow) {
                      previewWindow.document.write(iframeContent);
                      previewWindow.document.close();
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Buka di Tab Baru
                </button>
              </div>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onSave}
                disabled={!templateForm.name.trim() || !templateForm.content.trim() || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : type === "edit" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Buat Template
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Isi semua field yang diperlukan (*) • Pastikan HTML valid untuk hasil terbaik
          </p>
        </div>
      </Card>
    </div>
  );
}