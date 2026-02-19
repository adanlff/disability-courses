"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, ArrowLeft, CheckCircle, Loader2, Eye, EyeOff, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Step = "email" | "otp" | "newPassword" | "success";

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

function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sampleTestimonials = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
      name: "Sarah Chen",
      handle: "@sarahdigital",
      text: "Platform yang luar biasa! Pengalaman pengguna sangat lancar dan fiturnya tepat sesuai yang saya butuhkan.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
      name: "Marcus Johnson",
      handle: "@marcustech",
      text: "Layanan ini telah mengubah cara saya bekerja. Desain bersih, fitur powerful, dan dukungan yang excellent.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "David Martinez",
      handle: "@davidcreates",
      text: "Saya sudah mencoba banyak platform, tapi yang ini benar-benar menonjol. Intuitif, reliable, dan sangat membantu produktivitas.",
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

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim kode OTP");
      setCountdown(5 * 60); // 5 minutes
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
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

  // Step 2: Verify OTP (moves to password step)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }
    setError(null);
    setStep("newPassword");
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang kode");
      setCountdown(5 * 60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mereset password");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      // If OTP expired, go back to OTP step
      if (err instanceof Error && err.message.includes("kadaluarsa")) {
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] overflow-hidden">
      {/* Left column: form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {step === "email" && "Lupa Password?"}
              {step === "otp" && "Masukkan Kode OTP"}
              {step === "newPassword" && "Buat Password Baru"}
              {step === "success" && "Password Berhasil Direset!"}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {step === "email" && "Masukkan email Anda untuk menerima kode OTP"}
              {step === "otp" && (
                <span>Kode 6 digit telah dikirim ke <strong className="text-gray-700 dark:text-gray-300">{email}</strong></span>
              )}
              {step === "newPassword" && "Buat password baru yang kuat untuk akun Anda"}
              {step === "success" && "Silakan login dengan password baru Anda"}
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

            {/* STEP 1: Email */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">
                    Alamat Email
                  </label>
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
                  type="submit"
                  disabled={loading}
                  className="animate-element animate-delay-400 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Kode OTP"
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="animate-element animate-delay-300 flex justify-center gap-3" onPaste={handleOtpPaste}>
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
                      autoFocus={i === 0}
                      className="h-14 w-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-white shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="animate-element animate-delay-400 text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kode berlaku: <span className="font-bold text-violet-500 tabular-nums">{formatTime(countdown)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 dark:text-red-400 font-medium">Kode sudah kadaluarsa</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="animate-element animate-delay-500 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verifikasi Kode
                  </button>

                  <div className="animate-element animate-delay-600 text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading || countdown > 0}
                      className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {countdown > 0 ? `Kirim ulang dalam ${formatTime(countdown)}` : "Kirim ulang kode"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: New Password */}
            {step === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">
                    Password Baru
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>
                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground">
                    Konfirmasi Password
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 ml-1 font-medium">Password tidak cocok</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="animate-element animate-delay-500 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Password Baru"
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: Success */}
            {step === "success" && (
              <div className="space-y-6 text-center animate-element animate-delay-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 mb-4 animate-bounce">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Login Sekarang
                </button>
              </div>
            )}

            {step !== "success" && (
              <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
                Kembali ke{" "}
                <Link
                  href="/login"
                  className="text-violet-400 hover:underline transition-colors font-medium"
                >
                  Halaman Login
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80)` }}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}