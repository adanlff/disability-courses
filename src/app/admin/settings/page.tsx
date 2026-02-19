"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Database,
  Save,
  Plus,
  Trash2,
  Sliders,
  Users,
  BookOpen,
  DollarSign,
  Activity,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PlatformStats {
  total_users: number;
  new_users: number;
  total_courses: number;
  active_courses: number;
  total_enrollments: number;
  new_enrollments: number;
  total_revenue: number;
  recent_revenue: number;
}

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
};

export default function AdminSettings() {
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: "", color: "" });

  // System settings states
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // New setting form
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingType, setNewSettingType] = useState("string");
  const [newSettingCategory, setNewSettingCategory] = useState("general");
  const [addingNew, setAddingNew] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"password" | "system">("password");

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

  // Fetch system settings
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal memuat pengaturan");
      const data = await response.json();
      setSettings(data.settings || []);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Gagal memuat pengaturan");
    } finally {
      setSettingsLoading(false);
    }
  }, [getAuthToken]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/stats?period=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.overview);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [fetchSettings, fetchStats]);

  // Handle change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) { setPasswordError("Password lama harus diisi"); return; }
    if (!newPassword.trim()) { setPasswordError("Password baru harus diisi"); return; }
    if (newPassword.length < 8) { setPasswordError("Password baru minimal 8 karakter"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Konfirmasi password tidak cocok"); return; }
    if (currentPassword === newPassword) { setPasswordError("Password baru tidak boleh sama dengan password lama"); return; }

    try {
      setPasswordLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengubah password");

      setPasswordSuccess("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle update setting
  const handleUpdateSetting = async (setting: SystemSetting, newValue: string) => {
    try {
      setSavingKey(setting.key);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key: setting.key, value: newValue, type: setting.type, category: setting.category, is_public: setting.is_public }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan");

      setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s));
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSavingKey(null);
    }
  };

  // Handle add new setting
  const handleAddSetting = async () => {
    if (!newSettingKey.trim() || !newSettingValue.trim()) return;

    try {
      setAddingNew(true);
      const token = getAuthToken();
      const response = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newSettingKey,
          value: newSettingValue,
          type: newSettingType,
          category: newSettingCategory,
          is_public: false,
        }),
      });

      if (!response.ok) throw new Error("Gagal menambah setting");

      setNewSettingKey("");
      setNewSettingValue("");
      fetchSettings();
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Gagal menambah");
    } finally {
      setAddingNew(false);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const cat = setting.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment": return <DollarSign className="h-4 w-4 text-[#005EB8]" />;
      case "email": return <Activity className="h-4 w-4 text-[#005EB8]" />;
      case "course": return <BookOpen className="h-4 w-4 text-[#005EB8]" />;
      case "user": return <Users className="h-4 w-4 text-[#005EB8]" />;
      default: return <Sliders className="h-4 w-4 text-[#005EB8]" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Settings className="h-8 w-8 text-[#005EB8]" />
                Pengaturan Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola keamanan akun dan pengaturan sistem</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("password")}
              className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "password" ? "border-[#005EB8] text-[#005EB8]" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <Key className="h-4 w-4" />
              Keamanan Akun
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "system" ? "border-[#005EB8] text-[#005EB8]" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <Database className="h-4 w-4" />
              Pengaturan Sistem
            </button>
          </div>

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Key className="h-5 w-5 text-[#005EB8]" />
                      Ubah Password
                    </CardTitle>
                    <CardDescription>Pastikan password baru Anda kuat dan mudah diingat</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      {passwordError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <p className="text-red-600 dark:text-red-400 text-sm">{passwordError}</p>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-green-600 dark:text-green-400 text-sm">{passwordSuccess}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-gray-900 dark:text-white">Password Saat Ini</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Masukkan password saat ini"
                            className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                          />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-gray-900 dark:text-white">Password Baru</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan password baru"
                            className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {newPassword && (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : "bg-gray-200 dark:bg-gray-700"}`} />
                              ))}
                            </div>
                            <p className={`text-xs font-medium ${passwordStrength.score <= 2 ? "text-red-600 dark:text-red-400" : passwordStrength.score <= 4 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                              Kekuatan: {passwordStrength.label}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Konfirmasi Password Baru</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Konfirmasi password baru"
                            className="pl-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Password tidak cocok
                          </p>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Password cocok
                          </p>
                        )}
                      </div>

                      <Button type="submit" disabled={passwordLoading} className="w-full bg-[#005EB8] hover:bg-[#004A93]">
                        {passwordLoading ? (
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

              <div className="space-y-6">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
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
                          <span className={`text-sm ${criteria.met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                            {criteria.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-[#005EB8]/5 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <Info className="h-5 w-5 text-[#005EB8]" />
                      Tips Admin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-[#005EB8]">•</span>
                        <span>Gunakan password yang berbeda untuk akun admin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#005EB8]">•</span>
                        <span>Ganti password setiap 30 hari untuk keamanan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#005EB8]">•</span>
                        <span>Jangan bagikan akses admin ke pihak lain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#005EB8]">•</span>
                        <span>Aktifkan 2FA jika tersedia</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pengaturan Sistem</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kelola konfigurasi platform</p>
                </div>
              </div>

              {settingsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400">{settingsError}</p>
                </div>
              )}

              {/* Add New Setting */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Plus className="h-5 w-5 text-[#005EB8]" />
                    Tambah Setting Baru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Input 
                      placeholder="Key (misal: site_name)" 
                      value={newSettingKey} 
                      onChange={(e) => setNewSettingKey(e.target.value)}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                    />
                    <Input 
                      placeholder="Value" 
                      value={newSettingValue} 
                      onChange={(e) => setNewSettingValue(e.target.value)}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                    />
                    <Select value={newSettingType} onValueChange={setNewSettingType}>
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newSettingCategory} onValueChange={setNewSettingCategory}>
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddSetting} 
                      disabled={addingNew || !newSettingKey.trim() || !newSettingValue.trim()} 
                      className="bg-[#005EB8] hover:bg-[#004A93]"
                    >
                      {addingNew ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Settings by Category */}
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                </div>
              ) : Object.keys(groupedSettings).length === 0 ? (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-12 text-center">
                    <Database className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Setting</h3>
                    <p className="text-gray-500 dark:text-gray-400">Tambahkan setting baru di atas</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedSettings).map(([category, categorySettings]) => (
                  <Card key={category} className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold capitalize">
                        {getCategoryIcon(category)}
                        {category}
                        <Badge variant="outline" className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                          {categorySettings.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categorySettings.map((setting) => (
                          <div key={setting.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{setting.key}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {setting.type}
                                </Badge>
                                <Badge variant="secondary" className={`text-xs ${setting.is_public ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}`}>
                                  {setting.is_public ? "Public" : "Private"}
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full md:w-64">
                              <Input
                                defaultValue={setting.value}
                                onBlur={(e) => {
                                  if (e.target.value !== setting.value) {
                                    handleUpdateSetting(setting, e.target.value);
                                  }
                                }}
                                disabled={savingKey === setting.key}
                                className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                              />
                            </div>
                            {savingKey === setting.key && (
                              <Loader2 className="h-4 w-4 animate-spin text-[#005EB8]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}