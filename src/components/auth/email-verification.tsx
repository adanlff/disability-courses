import React, { useState } from 'react';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

// --- TYPE DEFINITIONS ---

interface EmailVerificationPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  isLoading?: boolean;
  message?: string | null;
  isSuccess?: boolean;
  onResendVerification?: (email: string) => void;
  onLogin?: () => void;
  token?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const SuccessAlert = ({ message, onLogin }: { message: string; onLogin?: () => void }) => (
  <div className="animate-element animate-delay-300 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
    <div className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-green-800 dark:text-green-200 text-sm font-medium">
          Verifikasi Berhasil!
        </p>
        <p className="text-green-700 dark:text-green-300 text-sm mt-1">
          {message}
        </p>
        {onLogin && (
          <button
            onClick={onLogin}
            className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Masuk ke Akun
          </button>
        )}
      </div>
    </div>
  </div>
);

const ErrorAlert = ({ message }: { message: string }) => (
  <div className="animate-element animate-delay-300 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-red-800 dark:text-red-200 text-sm font-medium">
          Verifikasi Gagal
        </p>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          {message}
        </p>
      </div>
    </div>
  </div>
);

const InfoAlert = ({ message }: { message: string }) => (
  <div className="animate-element animate-delay-300 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
    <div className="flex items-start gap-3">
      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          {message}
        </p>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Verifikasi Email Anda</span>,
  description = "Kami telah mengirimkan link verifikasi ke email Anda",
  heroImageSrc,
  isLoading = false,
  message,
  isSuccess = false,
  onResendVerification,
  onLogin,
  token,
}) => {
  const [email, setEmail] = useState('');

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onResendVerification) {
      onResendVerification(email);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: verification form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
              <p className="animate-element animate-delay-200 text-muted-foreground mt-2">{description}</p>
            </div>

            {/* Auto verification status */}
            {token && isLoading && (
              <div className="animate-element animate-delay-300 text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
                <p className="text-muted-foreground">Memverifikasi email Anda...</p>
              </div>
            )}

            {/* Success message */}
            {isSuccess && message && (
              <SuccessAlert message={message} onLogin={onLogin} />
            )}

            {/* Error message */}
            {!isSuccess && message && token && (
              <ErrorAlert message={message} />
            )}

            {/* Info message for resend */}
            {!isSuccess && message && !token && (
              <InfoAlert message={message} />
            )}

            {/* Resend verification form */}
            {!token && !isSuccess && (
              <form className="space-y-5 animate-element animate-delay-400" onSubmit={handleResend}>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <GlassInputWrapper>
                    <input 
                      type="email" 
                      placeholder="nama@email.com" 
                      className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </GlassInputWrapper>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || !email}
                  className="w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Ulang Verifikasi'
                  )}
                </button>
              </form>
            )}

            {/* Manual verification instructions */}
            {!token && !isSuccess && (
              <div className="animate-element animate-delay-500 space-y-4 text-center">
                <div className="border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Buka email Anda dan klik link verifikasi yang kami kirimkan.
                  </p>
                  <div className="bg-foreground/5 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-foreground mb-2">Tidak menemukan email?</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Periksa folder spam atau junk</li>
                      <li>• Pastikan email yang dimasukkan benar</li>
                      <li>• Tunggu beberapa menit</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Back to login link */}
            {!isSuccess && (
              <div className="animate-element animate-delay-600 text-center">
                <p className="text-sm text-muted-foreground">
                  Sudah verifikasi? <a href="#" onClick={(e) => { e.preventDefault(); onLogin?.(); }} className="text-violet-400 hover:underline transition-colors">Masuk di sini</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
        </section>
      )}
    </div>
  );
};