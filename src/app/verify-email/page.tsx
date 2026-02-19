"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VerifyEmailPage as VerifyEmailComponent, Testimonial } from "@/components/auth/verify-email";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "error",
    title: "",
    message: "",
  });
  const [countdown, setCountdown] = useState(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";
  const tokenFromParams = searchParams.get("token") || "";
  const [autoVerifying, setAutoVerifying] = useState(false);

  // Auto-verify when token is present in URL
  useEffect(() => {
    const autoVerify = async () => {
      if (tokenFromParams && !autoVerifying && verificationStatus === 'idle') {
        setAutoVerifying(true);
        setIsLoading(true);
        
        try {
          const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: tokenFromParams }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Handle specific error messages
            if (data.error === "Token tidak valid") {
              setErrorMessage("Token verifikasi tidak valid. Pastikan token yang dimasukkan benar dan belum kadaluarsa.");
              setVerificationStatus('error');
              return;
            }
            
            if (data.error === "Token sudah kadaluarsa") {
              setErrorMessage("Token sudah kadaluarsa. Silakan minta token verifikasi baru.");
              setVerificationStatus('error');
              return;
            }

            if (data.error === "Token sudah digunakan") {
              setErrorMessage("Email Anda sudah terverifikasi. Silakan login ke akun Anda.");
              setVerificationStatus('error');
              // Redirect to login after showing message
              setTimeout(() => {
                router.push("/login");
              }, 2000);
              return;
            }

            if (data.error === "Email tidak ditemukan") {
              setErrorMessage("Email tidak ditemukan. Pastikan email yang Anda masukkan benar.");
              setVerificationStatus('error');
              return;
            }

            throw new Error(data.error || "Terjadi kesalahan pada server");
          }

          // Verification successful
          setVerificationStatus('success');
          
          // Clear email from localStorage
          localStorage.removeItem("verification_email");
          
          // Show success alert
          showSweetAlert(
            "success", 
            "Verifikasi Berhasil!", 
            "Email Anda telah berhasil diverifikasi. Anda akan diarahkan ke halaman login."
          );

          // Redirect to login page after delay
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } catch (error) {
          console.error("Verifikasi otomatis gagal:", error);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan pada server, coba lagi nanti."
          );
          setVerificationStatus('error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    autoVerify();
  }, [tokenFromParams, autoVerifying, verificationStatus, router]);

  // Initialize email from params or local storage
  useEffect(() => {
    const savedEmail = localStorage.getItem("verification_email");
    if (emailFromParams) {
      setEmailInput(emailFromParams);
      localStorage.setItem("verification_email", emailFromParams);
    } else if (savedEmail) {
      setEmailInput(savedEmail);
    } else if (!tokenFromParams) {
      // Only show email form if there's no token in URL
      setShowEmailForm(true);
    }
  }, [emailFromParams, tokenFromParams]);

  // Sample testimonials data
  const sampleTestimonials: Testimonial[] = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
      name: "Sarah Chen",
      handle: "@sarahdigital",
      text: "Verifikasi email berjalan lancar! Token mudah ditemukan dan dimasukkan.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
      name: "Marcus Johnson",
      handle: "@marcustech",
      text: "Sistem verifikasi yang aman dengan token panjang. Sangat aman dan mudah digunakan!",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "David Martinez",
      handle: "@davidcreates",
      text: "Email verifikasi dengan token yang jelas. Proses copy-paste sangat mudah!",
    },
  ];

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  const handleVerify = async (token: string) => {
    if (!emailInput.trim()) {
      setErrorMessage("Email tidak ditemukan. Silakan masukkan email Anda terlebih dahulu.");
      setVerificationStatus('error');
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setVerificationStatus('idle');

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages
        if (data.error === "Token tidak valid") {
          setErrorMessage("Token verifikasi tidak valid. Pastikan token yang dimasukkan benar dan belum kadaluarsa.");
          setVerificationStatus('error');
          return;
        }
        
        if (data.error === "Token sudah kadaluarsa") {
          setErrorMessage("Token sudah kadaluarsa. Silakan minta token verifikasi baru.");
          setVerificationStatus('error');
          return;
        }

        if (data.error === "Token sudah digunakan") {
          setErrorMessage("Email Anda sudah terverifikasi. Silakan login ke akun Anda.");
          setVerificationStatus('error');
          return;
        }

        if (data.error === "Email tidak ditemukan") {
          setErrorMessage("Email tidak ditemukan. Pastikan email yang Anda masukkan benar.");
          setVerificationStatus('error');
          return;
        }

        throw new Error(data.error || "Terjadi kesalahan pada server");
      }

      // Verification successful
      setVerificationStatus('success');
      
      // Clear email from localStorage
      localStorage.removeItem("verification_email");
      
      // Show success alert
      showSweetAlert(
        "success", 
        "Verifikasi Berhasil!", 
        "Email Anda telah berhasil diverifikasi. Anda akan diarahkan ke halaman login."
      );

      // Redirect to login page after delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Verifikasi gagal:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan pada server, coba lagi nanti."
      );
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    if (!email.trim()) {
      showSweetAlert(
        "error",
        "Email Kosong",
        "Silakan masukkan email Anda terlebih dahulu."
      );
      return;
    }

    setIsResending(true);
    setCountdown(60); // Set countdown 60 detik

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if user is already verified
        if (data.error === "Email sudah terverifikasi") {
          showSweetAlert(
            "info",
            "Email Sudah Terverifikasi",
            "Email Anda sudah terverifikasi. Silakan login ke akun Anda."
          );
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return;
        }

        // Check if email is not registered
        if (response.status === 404) {
          showSweetAlert(
            "info",
            "Email Tidak Ditemukan",
            "Email ini tidak terdaftar dalam sistem kami. Pastikan email yang Anda masukkan benar."
          );
          return;
        }

        throw new Error(data.error || "Terjadi kesalahan pada server");
      }

      // Save email to localStorage
      localStorage.setItem("verification_email", email);
      setShowEmailForm(false);
      setIsChangingEmail(false);

      // Show success alert
      showSweetAlert(
        "success", 
        "Email Terkirim!", 
        "Token verifikasi baru telah dikirim ke email Anda. Periksa folder spam jika tidak menemukannya."
      );
    } catch (error) {
      console.error("Gagal mengirim ulang:", error);
      showSweetAlert(
        "error",
        "Gagal Mengirim Ulang",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan pada server, coba lagi nanti."
      );
      setCountdown(0); // Reset countdown jika gagal
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showSweetAlert(
        "error",
        "Email Kosong",
        "Silakan masukkan email Anda terlebih dahulu."
      );
      return;
    }

    await handleResend(emailInput);
  };

  const handleChangeEmail = () => {
    setIsChangingEmail(true);
    setShowEmailForm(true);
  };

  const handleCancelChangeEmail = () => {
    setIsChangingEmail(false);
    setShowEmailForm(false);
  };

  const handleClearEmail = () => {
    setEmailInput("");
    localStorage.removeItem("verification_email");
    setShowEmailForm(true);
    setIsChangingEmail(false);
  };

  // Render loading state when auto-verifying from URL token
  if (autoVerifying && tokenFromParams) {
    return (
      <div>
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={alertConfig.type === "success" ? 3000 : 5000}
          showCloseButton={true}
        />

        <div className="h-screen flex flex-col md:flex-row font-geist bg-background overflow-hidden">
          <section className="flex-1 flex items-center justify-center p-0 md:p-8">
            <div className="w-full max-w-md mx-auto p-6 text-center">
              <div className="flex flex-col items-center gap-6">
                {verificationStatus === 'idle' && (
                  <>
                    <div className="w-20 h-20 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-semibold mb-2">Memverifikasi Email...</h1>
                      <p className="text-muted-foreground">Mohon tunggu, kami sedang memverifikasi email Anda.</p>
                    </div>
                  </>
                )}
                
                {verificationStatus === 'success' && (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-green-500">Verifikasi Berhasil!</h1>
                      <p className="text-muted-foreground">Email Anda telah diverifikasi. Mengalihkan ke halaman login...</p>
                    </div>
                  </>
                )}
                
                {verificationStatus === 'error' && (
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-red-500">Verifikasi Gagal</h1>
                      <p className="text-muted-foreground">{errorMessage || "Terjadi kesalahan saat memverifikasi email."}</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <a
                        href="/login"
                        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        Ke Halaman Login
                      </a>
                      <button
                        onClick={() => {
                          setAutoVerifying(false);
                          setShowEmailForm(true);
                          setVerificationStatus('idle');
                        }}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Minta Token Baru
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Right column: hero image */}
          <section className="hidden md:block flex-1 relative p-4">
            <div
              className="absolute inset-4 rounded-lg bg-cover bg-center"
              style={{ 
                backgroundImage: `url(https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=2160&q=80)` 
              }}
            ></div>
          </section>
        </div>
      </div>
    );
  }

  // Render email input form
  if (showEmailForm) {
    return (
      <div>
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={alertConfig.type === "success" ? 3000 : 5000}
          showCloseButton={true}
        />

        <div className="h-screen flex flex-col md:flex-row font-geist bg-background overflow-hidden">
          {/* Left column: email input form */}
          <section className="flex-1 flex items-center justify-center p-0 md:p-8">
            <div className="w-full max-w-md mx-auto p-6">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                    {isChangingEmail ? "Ganti Email" : "Verifikasi Email"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isChangingEmail 
                      ? "Masukkan email baru untuk menerima token verifikasi" 
                      : "Masukkan email Anda untuk menerima token verifikasi"}
                  </p>
                </div>

                {/* Current Email Info (if changing) */}
                {isChangingEmail && localStorage.getItem("verification_email") && (
                  <div className="animate-element animate-delay-250 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-card-foreground shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          Email sebelumnya:
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {localStorage.getItem("verification_email")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Input Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-3">
                      Email {isChangingEmail ? "Baru" : "Anda"}
                    </label>
                    <div className="rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 backdrop-blur-sm focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
                      <input
                        type="email"
                        placeholder="contoh@email.com"
                        className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        autoFocus={isChangingEmail}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isResending}
                      className="flex-1 rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isResending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Mengirim Token...
                        </>
                      ) : isChangingEmail ? (
                        "Kirim ke Email Baru"
                      ) : (
                        "Kirim Token Verifikasi"
                      )}
                    </button>

                    {isChangingEmail && (
                      <button
                        type="button"
                        onClick={handleCancelChangeEmail}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-4 font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                {/* Additional Info */}
                <div className="pt-4 border-t border-border">
                  <p className="text-center text-sm text-muted-foreground">
                    {isChangingEmail ? (
                      <>
                        Kembali ke{" "}
                        <button
                          type="button"
                          onClick={handleCancelChangeEmail}
                          className="text-violet-400 hover:underline transition-colors"
                        >
                          verifikasi token
                        </button>
                      </>
                    ) : (
                      <>
                        Sudah memiliki token?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            if (emailInput.trim()) {
                              setShowEmailForm(false);
                            } else {
                              showSweetAlert(
                                "info",
                                "Masukkan Email",
                                "Silakan masukkan email Anda terlebih dahulu untuk melanjutkan."
                              );
                            }
                          }}
                          className="text-violet-400 hover:underline transition-colors"
                        >
                          Masukkan token verifikasi
                        </button>
                      </>
                    )}
                  </p>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Token akan dikirim ke email Anda dan berlaku selama 24 jam
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right column: hero image + testimonials */}
          <section className="hidden md:block flex-1 relative p-4">
            <div
              className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center"
              style={{ 
                backgroundImage: `url(https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=2160&q=80)` 
              }}
            ></div>
            {sampleTestimonials.length > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
                <div className="rounded-lg border bg-card/40 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-xl border-white/10 w-64">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <img
                        src={sampleTestimonials[0].avatarSrc}
                        className="h-10 w-10 object-cover rounded-lg"
                        alt="avatar"
                      />
                      <div className="text-sm leading-snug">
                        <p className="flex items-center gap-1 font-medium">
                          {sampleTestimonials[0].name}
                        </p>
                        <p className="text-muted-foreground">
                          {sampleTestimonials[0].handle}
                        </p>
                        <p className="mt-1 text-foreground/80">
                          {sampleTestimonials[0].text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Render token verification form if email is provided
  return (
    <div>
      {/* Sweet Alert Component */}
      <SweetAlert
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        duration={alertConfig.type === "success" ? 3000 : 5000}
        showCloseButton={true}
      />

      <VerifyEmailComponent
        title="Verifikasi Email"
        description="Masukkan token verifikasi yang telah dikirim ke email Anda"
        heroImageSrc="https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=2160&q=80"
        testimonials={sampleTestimonials}
        email={emailInput}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangeEmail={handleChangeEmail}
        onClearEmail={handleClearEmail}
        isLoading={isLoading}
        isResending={isResending}
        verificationStatus={verificationStatus}
        errorMessage={errorMessage}
        countdown={countdown}
      />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat halaman verifikasi...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}