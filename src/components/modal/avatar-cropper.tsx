"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check, RotateCcw, User, Crop as CropIcon, AlertCircle, Maximize2 } from "lucide-react";

interface AvatarCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 70,
      },
      1,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function AvatarCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  open,
}: AvatarCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height));
    },
    []
  );

  // Reset crop when dialog opens
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setShowInstructions(true);
    }
  }, [open]);

  // Handle cached images (already loaded)
  useEffect(() => {
    if (open && imgRef.current) {
      const img = imgRef.current;
      // Cek apakah gambar sudah ter-load (cached)
      if (img.complete) {
        const { width, height } = img;
        setCrop(centerAspectCrop(width, height));
      }
    }
  }, [open, imageSrc]); // Tambahkan imageSrc sebagai dependency

  // Generate cropped image
  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Calculate scale factor based on actual image size vs displayed size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to cropped dimensions (square for avatar)
    const pixelRatio = window.devicePixelRatio || 1;
    const size = Math.min(completedCrop.width * scaleX, completedCrop.height * scaleY);
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      size,
      size
    );

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        setIsProcessing(false);
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [completedCrop, onCropComplete]);

  // Reset crop to center
  const handleReset = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height));
    }
  }, []);

  if (!mounted || !open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
      <Card
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CSS untuk mengatur tampilan handle resize */}
        <style jsx>{`
          .crop-container {
            overflow-y: auto;
            overflow-x: hidden !important;
          }
          /* Tampilkan drag handles (sudut-sudut resize) */
          .ReactCrop__drag-handle {
            display: block !important;
            background-color: white !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 50% !important;
            width: 12px !important;
            height: 12px !important;
          }
          /* Sembunyikan drag bars (sisi-sisi resize) */
          .ReactCrop__drag-bar {
            display: none !important;
          }
          /* Sembunyikan elemen-aspect */
          .ReactCrop__aspect {
            display: none !important;
          }
        `}</style>

        {/* Header - compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <CropIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Crop Foto Profil
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sesuaikan area crop untuk foto profil Anda
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Konten utama dengan scroll vertikal saja - compact height */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-5">
            {/* Area Crop - compact */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="relative max-h-[45vh] crop-container">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  minWidth={100}
                  minHeight={100}
                  className="min-w-full min-h-[200px]"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="w-full h-auto object-contain"
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
              
              {/* Control bar - compact */}
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  {showInstructions ? "Sembunyikan petunjuk" : "Tampilkan petunjuk"}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded text-[11px]">
                    Rasio: 1:1
                  </span>
                  <span className="hidden sm:inline">Drag sudut untuk resize, drag area untuk geser</span>
                </div>
              </div>
            </div>

            {/* Petunjuk - compact, can be hidden */}
            {showInstructions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-fade-in">
                <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-md flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                          Rasio 1:1 (Persegi)
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Area crop tetap persegi sempurna saat di-resize
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-green-100 dark:bg-green-800 rounded-md flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                          Cara Menggunakan
                        </p>
                        <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5">
                          <li>• Tarik sudut (bulatan biru) untuk memperbesar/kecilkan area</li>
                          <li>• Drag area tengah crop untuk menggeser posisi</li>
                          <li>• Rasio 1:1 selalu terjaga saat resize</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tombol aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex gap-2.5 w-full sm:w-auto sm:order-2">
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Batal
                </button>
              </div>

              <button
                onClick={handleCropComplete}
                disabled={!completedCrop || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:order-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Terapkan Crop
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </div>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Area crop bisa di-resize dari sudut (tetap rasio 1:1). Geser untuk memposisikan wajah di tengah
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}