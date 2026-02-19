"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Mail, Edit2, X } from "lucide-react";

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface VerifyEmailPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  email?: string;
  onVerify?: (token: string) => void;
  onResend?: (email: string) => void;
  onChangeEmail?: () => void;
  onClearEmail?: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  verificationStatus?: 'idle' | 'success' | 'error';
  errorMessage?: string;
  countdown?: number;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <Card className="rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 backdrop-blur-sm focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    <CardContent className="p-0">
      {children}
    </CardContent>
  </Card>
);

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: string;
}) => (
  <Card className={`animate-testimonial ${delay} rounded-lg border bg-card/40 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-xl border-white/10 w-64`}>
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <img
          src={testimonial.avatarSrc}
          className="h-10 w-10 object-cover rounded-lg"
          alt="avatar"
        />
        <div className="text-sm leading-snug">
          <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
          <p className="text-muted-foreground">{testimonial.handle}</p>
          <p className="mt-1 text-foreground/80">{testimonial.text}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatusMessage = ({
  message,
  type = "info",
}: {
  message: string;
  type?: "success" | "error" | "info";
}) => {
  const colors = {
    success: "text-green-500 bg-green-500/10 border-green-500/20",
    error: "text-red-500 bg-red-500/10 border-red-500/20",
    info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className={`mt-4 p-3 rounded-lg border ${colors[type]} flex items-start gap-2`}>
      {type === "success" && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      {type === "error" && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      {type === "info" && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      <p className="text-sm">{message}</p>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  title = (
    <span className="font-light text-foreground tracking-tighter">
      Verifikasi Email
    </span>
  ),
  description = "Masukkan token verifikasi yang telah dikirim ke email Anda",
  heroImageSrc,
  testimonials = [],
  email = "",
  onVerify,
  onResend,
  onChangeEmail,
  onClearEmail,
  isLoading = false,
  isResending = false,
  verificationStatus = 'idle',
  errorMessage = "",
  countdown = 0,
}) => {
  const [token, setToken] = useState("");
  const [localError, setLocalError] = useState("");
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Reset error ketika token berubah
  useEffect(() => {
    if (localError && token.trim()) {
      setLocalError("");
    }
  }, [token, localError]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setLocalError("Token verifikasi harus diisi");
      return;
    }
    
    if (token.length < 10) {
      setLocalError("Token verifikasi terlalu pendek");
      return;
    }
    
    onVerify?.(token.trim());
  };

  const handleResendClick = () => {
    if (email && countdown === 0) {
      onResend?.(email);
    }
  };

  const handleChangeEmailClick = () => {
    if (onChangeEmail) {
      onChangeEmail();
    }
  };

  const handleClearEmailClick = () => {
    if (onClearEmail) {
      onClearEmail();
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row font-geist bg-background overflow-hidden">
      {/* Left column: verification form */}
      <section className="flex-1 flex items-center justify-center p-0 md:p-8">
        <div 
          ref={formContainerRef}
          className="w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto"
        >
          <div className="w-full max-w-md mx-auto p-6 md:p-0">
            <div className="flex flex-col gap-6">
              {/* Header tanpa ikon */}
              <div className="flex flex-col gap-2">
                <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                  {title}
                </h1>
                <p className="animate-element animate-delay-200 text-muted-foreground">
                  {description}
                </p>
              </div>

              {/* Email Display with Change Option */}
              {email && (
                <div className="animate-element animate-delay-250">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Email yang diverifikasi
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleChangeEmailClick}
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        title="Ganti email"
                      >
                        <Edit2 className="w-3 h-3" />
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={handleClearEmailClick}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                        title="Hapus email"
                      >
                        <X className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                  
                  <Card className="rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-violet-400/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Mail className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{email}</p>
                          <p className="text-xs text-muted-foreground">
                            Token akan dikirim ke email ini
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Status Messages */}
              {verificationStatus === 'success' && (
                <StatusMessage 
                  type="success" 
                  message="Email berhasil diverifikasi! Anda akan diarahkan ke halaman login dalam 3 detik." 
                />
              )}
              
              {verificationStatus === 'error' && errorMessage && (
                <StatusMessage 
                  type="error" 
                  message={errorMessage} 
                />
              )}

              {verificationStatus === 'idle' && (
                <StatusMessage 
                  type="info" 
                  message="Token verifikasi telah dikirim ke email Anda. Token ini akan kadaluarsa dalam 24 jam." 
                />
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Token Input */}
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground block mb-3">
                    Token Verifikasi
                  </label>
                  
                  <GlassInputWrapper>
                    <input
                      type="text"
                      placeholder="Masukkan token verifikasi dari email Anda"
                      className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none font-mono"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      autoFocus
                    />
                  </GlassInputWrapper>

                  {(localError || (verificationStatus === 'error' && !errorMessage)) && (
                    <p className="text-red-500 text-sm mt-3">
                      {localError || "Token verifikasi tidak valid"}
                    </p>
                  )}

                  {token.length >= 64 && !localError && verificationStatus === 'idle' && (
                    <p className="text-green-500 text-sm mt-3">
                      Token terdeteksi, klik verifikasi untuk melanjutkan
                    </p>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || !token.trim()}
                  className="animate-element animate-delay-400 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    "Verifikasi Email"
                  )}
                </button>
              </form>

              {/* Resend Section */}
              <div className="animate-element animate-delay-500">
                <div className="relative flex items-center justify-center mb-4">
                  <span className="w-full border-t border-border"></span>
                  <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                    Tidak menerima token?
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleResendClick}
                      disabled={isResending || countdown > 0 || !email}
                      className="inline-flex items-center justify-center gap-2 text-sm text-violet-400 hover:text-violet-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Mengirim ulang...
                        </>
                      ) : countdown > 0 ? (
                        `Kirim ulang dalam ${countdown} detik`
                      ) : !email ? (
                        "Masukkan email terlebih dahulu"
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Kirim ulang token verifikasi
                        </>
                      )}
                    </button>

                    {email && (
                      <button
                        type="button"
                        onClick={handleChangeEmailClick}
                        className="inline-flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Kirim ke email yang berbeda
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Periksa folder spam jika tidak menemukan email verifikasi
                  </p>
                </div>
              </div>

              {/* Back to Login */}
              <div className="animate-element animate-delay-600 pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Sudah verifikasi email?{" "}
                  <a
                    href="/login"
                    className="text-violet-400 hover:underline transition-colors"
                  >
                    Masuk ke akun Anda
                  </a>
                </p>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Atau{" "}
                  <a
                    href="/register"
                    className="text-violet-400 hover:underline transition-colors"
                  >
                    daftar akun baru
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard
                testimonial={testimonials[0]}
                delay="animate-delay-700"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-900"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1100"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};