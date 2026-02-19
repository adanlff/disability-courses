"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Shield,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/protected-route";
import AvatarCropper from "@/components/modal/avatar-cropper";

type DisabilityType = "BUTA_WARNA" | "DISLEKSIA" | "KOGNITIF" | "LOW_VISION" | "MENTOR" | "MOTORIK" | "TUNARUNGU" | null;

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  disability_type: DisabilityType;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  full_name: string;
  phone: string;
  bio: string;
  date_of_birth: string;
  address: string;
  city: string;
  disability_type: string;
}

const disabilityTypes = [
  { value: "", label: "Tidak Ada" },
  { value: "BUTA_WARNA", label: "Buta Warna" },
  { value: "DISLEKSIA", label: "Disleksia" },
  { value: "KOGNITIF", label: "Disabilitas Kognitif" },
  { value: "LOW_VISION", label: "Low Vision" },
  { value: "MOTORIK", label: "Disabilitas Motorik" },
  { value: "TUNARUNGU", label: "Tunarungu" },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateInput = (dateString: string | null) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarCropperOpen, setAvatarCropperOpen] = useState(false);
  const [tempAvatarSrc, setTempAvatarSrc] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    phone: "",
    bio: "",
    date_of_birth: "",
    address: "",
    city: "",
    disability_type: "",
  });

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          return;
        }

        const response = await fetch(`/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Gagal mengambil data profil");

        const data = await response.json();
        setProfile(data.user);
        setFormData({
          full_name: data.user.full_name || "",
          phone: data.user.phone || "",
          bio: data.user.bio || "",
          date_of_birth: formatDateInput(data.user.date_of_birth),
          address: data.user.address || "",
          city: data.user.city || "",
          disability_type: data.user.disability_type || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getAuthToken]);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle select change
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, disability_type: value }));
  };

  // Handle avatar file select - opens cropper
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5MB");
      return;
    }

    // Create preview and open cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempAvatarSrc(reader.result as string);
      setAvatarCropperOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle avatar crop complete - uploads cropped image
  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    try {
      setUploadingAvatar(true);
      setError(null);
      setAvatarCropperOpen(false);
      setTempAvatarSrc(null);

      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      // Convert blob to file
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

      // Use POST /api/users/profile/picture which handles upload and database update
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch(`/api/users/profile/picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal upload foto");
      }

      const data = await response.json();
      setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : null);
      setSuccess("Foto profil berhasil diperbarui");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle save profile
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(`/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone || null,
          bio: formData.bio || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          city: formData.city || null,
          disability_type: formData.disability_type || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan profil");
      }

      const data = await response.json();
      setProfile((prev) => prev ? { ...prev, ...data.user } : null);
      setSuccess("Profil berhasil diperbarui");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-[#D93025] mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{error || "Profil tidak ditemukan"}</h2>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
            >
              Coba Lagi
            </Button>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <User className="h-8 w-8 text-[#005EB8]" />
                Profil Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola informasi pribadi Anda</p>
            </div>
            <div className="flex justify-center md:justify-end">
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)} 
                    disabled={saving}
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Profile Header Card */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar Section */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-[#005EB8]">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                    <AvatarFallback className="text-3xl bg-[#005EB8] text-white">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-[#005EB8] text-white rounded-full hover:bg-[#004A93] transition-colors disabled:opacity-50 shadow-md"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h2>
                    {profile.email_verified && (
                      <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Terverifikasi
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                    <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {profile.role === "STUDENT" ? "Student" : profile.role.toLowerCase()}
                    </Badge>
                    {profile.disability_type && (
                      <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">
                        {disabilityTypes.find(t => t.value === profile.disability_type)?.label}
                      </Badge>
                    )}
                  </div>
                  {/* Edit mode for bio - hidden from header, only in card */}
                  {isEditing && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        Bio dapat diedit di bagian "Alamat & Bio" di bawah
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#005EB8]" />
                    <span>Bergabung {formatDate(profile.created_at)}</span>
                  </div>
                  {profile.last_login && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#005EB8]" />
                      <span>Login terakhir {formatDate(profile.last_login)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#005EB8]" />
                    <span>Status: <span className="font-medium text-gray-900 dark:text-white">{profile.status}</span></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info - Updated to match mentor style */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <User className="h-5 w-5 text-[#005EB8]" />
                  Informasi Pribadi
                </CardTitle>
                <CardDescription>Data diri Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isEditing ? (
                  // Edit Mode
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-900 dark:text-gray-100">Nama Lengkap</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Nama lengkap Anda"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-900 dark:text-gray-100">Nomor Telepon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="08xxxxxxxxxx"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-gray-900 dark:text-gray-100">Tanggal Lahir</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disability_type" className="text-gray-900 dark:text-gray-100">Jenis Disabilitas</Label>
                      <Select value={formData.disability_type} onValueChange={handleSelectChange}>
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800">
                          <SelectValue placeholder="Pilih jenis disabilitas" />
                        </SelectTrigger>
                        <SelectContent>
                          {disabilityTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value || "none"}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  // View Mode - Updated to match mentor card style
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Nama Lengkap</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profile.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Nomor Telepon</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profile.phone || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Tanggal Lahir</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile.date_of_birth ? formatDate(profile.date_of_birth) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-gray-400">Jenis Disabilitas</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {disabilityTypes.find((t) => t.value === profile.disability_type)?.label || "Tidak Ada"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address & Bio - Updated to match mentor style */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <MapPin className="h-5 w-5 text-[#005EB8]" />
                  Alamat & Bio
                </CardTitle>
                <CardDescription>Informasi lokasi dan tentang Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isEditing ? (
                  // Edit Mode
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-900 dark:text-gray-100">Kota</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Kota tempat tinggal"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-900 dark:text-gray-100">Alamat Lengkap</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Alamat lengkap Anda"
                        rows={3}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-900 dark:text-gray-100">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Ceritakan tentang diri Anda..."
                        rows={4}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 resize-none"
                      />
                    </div>
                  </>
                ) : (
                  // View Mode - Updated to match mentor card style
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Kota</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profile.city || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Alamat Lengkap</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profile.address || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 dark:text-gray-400">Bio</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profile.bio || "-"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                <Shield className="h-5 w-5 text-[#005EB8]" />
                Informasi Akun
              </CardTitle>
              <CardDescription>Detail akun Anda (tidak dapat diubah)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#005EB8]" />
                      <p className="font-medium text-gray-900 dark:text-white">{profile.email}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#F4B400]" />
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{profile.role.toLowerCase()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status Akun</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#008A00]" />
                      <Badge className={profile.status === "ACTIVE" ? 
                        "bg-[#008A00] text-white border border-[#008A00] pointer-events-none" : 
                        "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none"}>
                        {profile.status === "ACTIVE" ? "Aktif" : profile.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Avatar Cropper Dialog */}
        {tempAvatarSrc && (
          <AvatarCropper
            imageSrc={tempAvatarSrc}
            open={avatarCropperOpen}
            onCropComplete={handleAvatarCropComplete}
            onCancel={() => {
              setAvatarCropperOpen(false);
              setTempAvatarSrc(null);
            }}
          />
        )}
      </UserLayout>
    </ProtectedRoute>
  );
}