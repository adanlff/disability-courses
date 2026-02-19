"use client";

import React from 'react';
import { X, Download, Printer, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PreviewCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContent: string;
  pdfUrl: string | null;
  onPrint: () => void;
  certificateNumber: string;
}

export function PreviewCertificateModal({
  open,
  onOpenChange,
  previewContent,
  pdfUrl,
  onPrint,
  certificateNumber,
}: PreviewCertificateModalProps) {
  if (!open) return null;

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
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview Sertifikat
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No. Sertifikat: <span className="font-medium">{certificateNumber}</span>
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
            {/* Preview Certificate Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Preview Sertifikat
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {previewContent ? (
                  <iframe 
                    srcDoc={previewContent} 
                    className="w-full h-[400px] border-0" 
                    title="Preview Sertifikat"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center p-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-3"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                      Memuat preview sertifikat...
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                      Mohon tunggu sebentar
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Info Tambahan - compact */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Informasi Penting
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Pastikan semua informasi pada sertifikat sudah benar sebelum mencetak atau mendownload.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onPrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3 h-3" />
                Cetak Sertifikat
              </button>
              
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex-1 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg py-2.5 px-4 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  Download PDF
                </a>
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
            Sertifikat ini diverifikasi dan dikeluarkan secara resmi oleh platform kami
          </p>
        </div>
      </Card>
    </div>
  );
}  