"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, Loader2, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
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
              ) : (
                <Mail className="h-8 w-8 text-[#005EB8]" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === "success" ? "Email Terverifikasi!" : "Verifikasi Email"}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {step === "success"
                ? "Akun Anda sudah aktif dan siap digunakan"
                : email
                ? <span>Masukkan kode OTP yang dikirim ke <strong className="text-gray-700 dark:text-gray-300">{email}</strong></span>
                : "Masukkan email dan kode OTP untuk verifikasi"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {step === "input" && (
              <form onSubmit={handleVerify} className="space-y-6">
                {/* Email field - shown if no email from params or user wants to change */}
                {showEmailChange ? (
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResend}
                        disabled={resending || !email}
                        className="shrink-0 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8] hover:text-white"
                      >
                        {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim"}
                      </Button>
                    </div>
                  </div>
                ) : email ? (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Email: <span className="font-medium text-gray-900 dark:text-white">{email}</span></span>
                    <button type="button" onClick={() => setShowEmailChange(true)} className="text-[#005EB8] hover:underline text-xs ml-2">
                      Ubah
                    </button>
                  </div>
                ) : null}

                {/* OTP Boxes */}
                <div className="space-y-3">
                  <Label className="block text-center text-sm">Kode OTP (6 Digit)</Label>
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
                        className="h-14 w-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-2xl font-bold text-gray-900 dark:text-white shadow-sm focus:border-[#005EB8] focus:outline-none focus:ring-2 focus:ring-[#005EB8]/20 transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                {email && !showEmailChange && (
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kode berlaku: <span className="font-bold text-[#005EB8] tabular-nums">{formatTime(countdown)}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-500 dark:text-red-400 font-medium">Kode sudah kadaluarsa</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#005EB8] hover:bg-[#004A93]"
                  disabled={loading || otp.join("").length !== 6 || !email}
                >
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memverifikasi...</> : "Verifikasi Email"}
                </Button>

                {/* Resend */}
                {email && !showEmailChange && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || countdown > 0}
                      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005EB8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {resending ? "Mengirim..." : countdown > 0 ? `Kirim ulang dalam ${formatTime(countdown)}` : "Kirim ulang kode"}
                    </button>
                  </div>
                )}
              </form>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Email <strong>{email}</strong> berhasil diverifikasi. Akun Anda kini aktif.
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