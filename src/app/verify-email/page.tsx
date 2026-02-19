"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, Loader2, RotateCcw, ArrowLeft, ShieldCheck, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  testimonial: { avatarSrc: string; name: string; handle: string; text: string };
  delay: string;
}) => (
  <Card
    className={`rounded-lg border bg-card/40 text-card-foreground shadow-sm transition-all duration-300 border-white/10 backdrop-blur-xl animate-testimonial ${delay} w-64`}
  >
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

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"input" | "success">("input");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(emailFromParams ? 5 * 60 : 0);
  const [showEmailChange, setShowEmailChange] = useState(!emailFromParams);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sampleTestimonials = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/44.jpg",
      name: "Aisha Rahma",
      handle: "@aishadigital",
      text: "Platform yang sangat inklusif! Membantu saya belajar dengan cara yang paling nyaman sesuai kebutuhan saya.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Budi Santoso",
      handle: "@buditech",
      text: "Fitur aksesibilitasnya luar biasa. Sangat jarang menemukan platform yang benar-benar memikirkan semua pengguna.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Linda Wijaya",
      handle: "@linda_w",
      text: "Pengalaman verifikasi yang cepat dan aman. Saya merasa tenang menggunakan platform yang mengutamakan keamanan akun.",
    },
  ];

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Submit OTP verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }
    if (!email) {
      setError("Email harus diisi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verifikasi gagal");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!email) {
      setError("Masukkan email terlebih dahulu");
      return;
    }
    setResending(true);
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang kode");
      setCountdown(5 * 60);
      setShowEmailChange(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] overflow-hidden">
      {/* Left column: form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {step === "success" ? "Email Terverifikasi!" : "Verifikasi Email"}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {step === "success"
                ? "Akun Anda sudah aktif dan siap digunakan. Silakan login sekarang."
                : email
                ? <span>Masukkan kode OTP yang dikirim ke <strong className="text-gray-700 dark:text-gray-300">{email}</strong></span>
                : "Silakan masukkan email Anda untuk menerima kode verifikasi."}
            </p>

            {/* Error Message */}
            {error && (
              <Card className="rounded-lg border bg-red-500/10 text-card-foreground shadow-sm border-red-500/20 animate-element animate-delay-250">
                <CardContent className="p-4">
                  <p className="text-red-500 text-sm text-center font-medium">
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {step === "input" && (
              <form onSubmit={handleVerify} className="space-y-6">
                {/* Email field */}
                <div className="animate-element animate-delay-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Alamat Email
                    </label>
                    {email && !showEmailChange && (
                      <button
                        type="button"
                        onClick={() => setShowEmailChange(true)}
                        className="text-xs text-violet-400 hover:text-violet-500 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Ubah Email
                      </button>
                    )}
                  </div>
                  
                  {showEmailChange ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <GlassInputWrapper>
                          <input
                            id="email"
                            type="email"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                          />
                        </GlassInputWrapper>
                      </div>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || !email}
                        className="rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20 px-4 font-medium hover:bg-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                      >
                        {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 transition-all">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {email}
                      </p>
                    </div>
                  )}
                </div>

                {/* OTP Boxes */}
                <div className="animate-element animate-delay-400 space-y-4">
                  <label className="block text-center text-sm font-medium text-muted-foreground">
                    Kode OTP (6 Digit)
                  </label>
                  <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0 && !!email && !showEmailChange}
                        className="h-14 w-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-white shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                {email && !showEmailChange && (
                  <div className="animate-element animate-delay-500 text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kode berlaku: <span className="font-bold text-violet-500 tabular-nums">{formatTime(countdown)}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-500 dark:text-red-400 font-medium">Kode sudah kadaluarsa</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6 || !email}
                    className="animate-element animate-delay-600 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Verifikasi Email"
                    )}
                  </button>

                  {/* Resend */}
                  {email && !showEmailChange && (
                    <div className="animate-element animate-delay-700 text-center">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || countdown > 0}
                        className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {resending ? "Mengirim..." : countdown > 0 ? `Kirim ulang dalam ${formatTime(countdown)}` : "Kirim ulang kode"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="space-y-6 text-center animate-element animate-delay-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 mb-4 animate-bounce">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Email <strong>{email}</strong> berhasil diverifikasi. Akun Anda kini sudah aktif dan siap untuk digunakan menjelajahi kursus kami.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Login Sekarang
                </button>
              </div>
            )}

            <p className="animate-element animate-delay-800 text-center text-sm text-muted-foreground mt-4">
              Kembali ke{" "}
              <Link
                href="/login"
                className="text-violet-400 hover:underline transition-colors font-medium"
              >
                Halaman Login
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=2160&q=80)` }}
        ></div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
          <TestimonialCard
            testimonial={sampleTestimonials[0]}
            delay="animate-delay-1000"
          />
          <div className="hidden xl:flex">
            <TestimonialCard
              testimonial={sampleTestimonials[1]}
              delay="animate-delay-1200"
            />
          </div>
          <div className="hidden 2xl:flex">
            <TestimonialCard
              testimonial={sampleTestimonials[2]}
              delay="animate-delay-1400"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}