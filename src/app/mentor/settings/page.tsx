"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Info,
  Sparkles,
  Award,
  Bell,
  ShieldCheck,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Lemah", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Sedang", color: "bg-yellow-500" };
  return { score, label: "Kuat", color: "bg-green-500" };
};

export default function MentorSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: "", color: "" });

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  }, [newPassword]);

  const passwordCriteria = [
    { label: "Minimal 8 karakter", met: newPassword.length >= 8 },
    { label: "Huruf kecil (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "Huruf besar (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "Angka (0-9)", met: /[0-9]/.test(newPassword) },
    { label: "Simbol (!@#$%)", met: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError("Password lama harus diisi");
      return;
    }
    if (!newPassword.trim()) {
      setError("Password baru harus diisi");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const response = await fetch(`/api/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengubah password");
      }

      setSuccess("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Settings className="h-8 w-8 text-[#005EB8]" />
                Pengaturan Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola keamanan dan preferensi akun mentor Anda</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Password Change Form */}
            <div className="lg:col-span-2">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Key className="h-5 w-5 text-[#005EB8]" />
                    Ubah Password
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Pastikan password baru Anda kuat dan mudah diingat</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    {/* Alerts */}
                    {error && (
                      <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </CardContent>
                      </Card>
                    )}
                    {success && (
                      <Card className="rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-900 dark:text-white">Password Saat Ini</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Masukkan password saat ini"
                          className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-900 dark:text-white">Password Baru</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan password baru"
                          className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      {/* Strength Indicator */}
                      {newPassword && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Kekuatan password:</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength.label === "Lemah" ? "text-red-600 dark:text-red-400" :
                              passwordStrength.label === "Sedang" ? "text-yellow-600 dark:text-yellow-400" :
                              "text-green-600 dark:text-green-400"
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${
                                  i <= passwordStrength.score ? 
                                  (passwordStrength.label === "Lemah" ? "bg-red-500" :
                                   passwordStrength.label === "Sedang" ? "bg-yellow-500" : "bg-green-500") : 
                                  "bg-gray-200 dark:bg-gray-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Konfirmasi Password Baru</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Konfirmasi password baru"
                          className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Password tidak cocok
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Password cocok
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#005EB8] hover:bg-[#004A93]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengubah Password...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Ubah Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Side Info */}
            <div className="space-y-6">
              {/* Password Criteria */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                    <Shield className="h-5 w-5 text-[#005EB8]" />
                    Kriteria Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {passwordCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {criteria.met ? (
                          <CheckCircle className="h-4 w-4 text-[#008A00]" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                        <span className={`text-sm ${criteria.met ? "text-[#008A00] font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          {criteria.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Tips */}
              <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/10 to-[#004A93]/10 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]/20 animate-scaleIn delay-200">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                    <Info className="h-5 w-5 text-[#005EB8]" />
                    Tips Keamanan Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="p-1 bg-[#005EB8]/20 rounded">
                        <Shield className="h-3 w-3 text-[#005EB8] mt-0.5" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Sebagai mentor, gunakan password unik untuk melindungi data peserta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="p-1 bg-[#005EB8]/20 rounded">
                        <Sparkles className="h-3 w-3 text-[#005EB8] mt-0.5" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Ganti password secara berkala setiap 3 bulan untuk keamanan maksimal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="p-1 bg-[#005EB8]/20 rounded">
                        <Award className="h-3 w-3 text-[#005EB8] mt-0.5" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Hindari menggunakan informasi pribadi yang mudah ditebak</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="p-1 bg-[#005EB8]/20 rounded">
                        <Bell className="h-3 w-3 text-[#005EB8] mt-0.5" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Gunakan kombinasi huruf, angka, dan simbol untuk password yang kuat</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}