import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowLeft, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ResetPasswordSuccessModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
  isOpen: boolean;
}

export const ResetPasswordSuccessModal: React.FC<ResetPasswordSuccessModalProps> = ({
  onClose,
  onBackToLogin,
  isOpen,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
      <Card 
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Password Berhasil Diubah!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Anda dapat login dengan password baru Anda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content - compact height with scroll */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-5">
            {/* Konfirmasi Perubahan - compact */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Konfirmasi Perubahan
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Password Anda telah berhasil diubah. 
                    Anda sekarang dapat menggunakan password baru untuk login ke akun Anda.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tips Keamanan - compact */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Tips Keamanan
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Simpan Password</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Simpan password baru Anda di tempat yang aman
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md flex-shrink-0 mt-0.5">
                        <ArrowLeft className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Login Ulang</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Gunakan password baru Anda untuk login
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-rose-50 dark:bg-rose-900/20 rounded-md flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Jangan Berikan</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Jangan bagikan password Anda kepada siapapun
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tombol Aksi - compact layout */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onBackToLogin}
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login
              </button>
              
              <button
                onClick={onClose}
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
            Butuh bantuan? Hubungi support@email.com
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
};