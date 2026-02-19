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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Back link */}
        <div className="mb-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#005EB8] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Login
          </Link>
        </div>

        <Card className="shadow-xl border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#005EB8]/10">
              {step === "success" ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : step === "newPassword" ? (
                <ShieldCheck className="h-8 w-8 text-[#005EB8]" />
              ) : step === "otp" ? (
                <KeyRound className="h-8 w-8 text-[#005EB8]" />
              ) : (
                <Mail className="h-8 w-8 text-[#005EB8]" />
              )}
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === "email" && "Lupa Password?"}
              {step === "otp" && "Masukkan Kode OTP"}
              {step === "newPassword" && "Buat Password Baru"}
              {step === "success" && "Password Berhasil Direset!"}
            </CardTitle>

            <CardDescription className="text-gray-500 dark:text-gray-400">
              {step === "email" && "Masukkan email Anda untuk menerima kode OTP"}
              {step === "otp" && (
                <span>Kode 6 digit telah dikirim ke <strong className="text-gray-700 dark:text-gray-300">{email}</strong></span>
              )}
              {step === "newPassword" && "Buat password baru yang kuat untuk akun Anda"}
              {step === "success" && "Silakan login dengan password baru Anda"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* STEP 1: Email */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#005EB8] hover:bg-[#004A93]" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengirim...</> : "Kirim Kode OTP"}
                </Button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
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
                      autoFocus={i === 0}
                      className="h-14 w-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-white shadow-sm focus:border-[#005EB8] focus:outline-none focus:ring-2 focus:ring-[#005EB8]/20 transition-all"
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kode berlaku: <span className="font-bold text-[#005EB8] tabular-nums">{formatTime(countdown)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 dark:text-red-400 font-medium">Kode sudah kadaluarsa</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#005EB8] hover:bg-[#004A93]"
                  disabled={loading || otp.join("").length !== 6}
                >
                  Verifikasi Kode
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || countdown > 0}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005EB8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {countdown > 0 ? `Kirim ulang dalam ${formatTime(countdown)}` : "Kirim ulang kode"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: New Password */}
            {step === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8]"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8]"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Password tidak cocok</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-[#005EB8] hover:bg-[#004A93]" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Password Baru"}
                </Button>
              </form>
            )}

            {/* STEP 4: Success */}
            {step === "success" && (
              <div className="space-y-4 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru.
                </p>
                <Button onClick={() => router.push("/login")} className="w-full bg-[#005EB8] hover:bg-[#004A93]">
                  Login Sekarang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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