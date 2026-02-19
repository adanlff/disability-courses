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
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Clock,
  Briefcase,
  GraduationCap,
  Star,
  Globe,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  Plus,
  X,
  Send,
  Award,
  Users,
  BookOpen,
  DollarSign,
  AlertTriangle,
  XCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  Crop,
  MapPin,
  Shield,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import AvatarCropper from "@/components/modal/avatar-cropper";
type MentorStatus = "PENDING" | "APPROVED" | "REJECTED";
interface MentorProfile {
  id: string;
  user_id: string;
  expertise: string[];
  experience: number;
  education: string | null;
  bio: string | null;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  portfolio: string | null;
  status: MentorStatus;
  rejection_reason: string | null;
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_reviews: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
  };
  _count?: {
    courses: number;
  };
}
interface FormData {
  expertise: string[];
  experience: number;
  education: string;
  bio: string;
  headline: string;
  website: string;
  linkedin: string;
  twitter: string;
  portfolio: string;
  phone: string;
}
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
export default function MentorProfilePage() {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newExpertise, setNewExpertise] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarCropperOpen, setAvatarCropperOpen] = useState(false);
  const [tempAvatarSrc, setTempAvatarSrc] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    expertise: [],
    experience: 0,
    education: "",
    bio: "",
    headline: "",
    website: "",
    linkedin: "",
    twitter: "",
    portfolio: "",
    phone: "",
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
        const response = await fetch(`/api/mentors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 404) {
          // No profile yet - show apply form
          setHasProfile(false);
          // Get user info for phone
          const userRes = await fetch(`/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setFormData((prev) => ({ ...prev, phone: userData.user?.phone || "" }));
          }
          return;
        }
        if (!response.ok) throw new Error("Gagal mengambil data profil");
        const data = await response.json();
        setProfile(data.profile);
        setHasProfile(true);
        setFormData({
          expertise: data.profile.expertise || [],
          experience: data.profile.experience || 0,
          education: data.profile.education || "",
          bio: data.profile.bio || "",
          headline: data.profile.headline || "",
          website: data.profile.website || "",
          linkedin: data.profile.linkedin || "",
          twitter: data.profile.twitter || "",
          portfolio: data.profile.portfolio || "",
          phone: data.profile.user?.phone || "",
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };
  // Add expertise
  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }));
      setNewExpertise("");
    }
  };
  // Remove expertise
  const removeExpertise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
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
      if (profile) {
        setProfile({
          ...profile,
          user: { ...profile.user, avatar_url: data.avatar_url },
        });
      }
      setSuccess("Foto profil berhasil diperbarui");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploadingAvatar(false);
    }
  };
  // Apply as mentor
  const handleApply = async () => {
    if (formData.expertise.length === 0) {
      setError("Tambahkan minimal 1 keahlian");
      return;
    }
    if (formData.experience < 1) {
      setError("Pengalaman harus minimal 1 tahun");
      return;
    }
    if (!formData.headline?.trim()) {
      setError("Headline harus diisi");
      return;
    }
    if (!formData.bio?.trim()) {
      setError("Bio harus diisi");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      const response = await fetch(`/api/mentors/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expertise: formData.expertise,
          experience: formData.experience,
          education: formData.education || null,
          bio: formData.bio,
          headline: formData.headline,
          website: formData.website || null,
          linkedin: formData.linkedin || null,
          twitter: formData.twitter || null,
          portfolio: formData.portfolio || null,
          phone: formData.phone || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengajukan pendaftaran mentor");
      }
      const data = await response.json();
      setSuccess("Pendaftaran mentor berhasil diajukan! Menunggu persetujuan admin.");
      setHasProfile(true);
      // Refetch profile
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan pendaftaran");
    } finally {
      setSaving(false);
    }
  };
  // Save profile
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      const response = await fetch(`/api/mentors/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expertise: formData.expertise,
          experience: formData.experience,
          education: formData.education || null,
          bio: formData.bio || null,
          headline: formData.headline || null,
          website: formData.website || null,
          linkedin: formData.linkedin || null,
          twitter: formData.twitter || null,
          portfolio: formData.portfolio || null,
          phone: formData.phone || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan profil");
      }
      setSuccess("Profil berhasil diperbarui");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };
  const getStatusBadge = (status: MentorStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Terverifikasi
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu Persetujuan
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
    }
  };
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }
  // Apply Form for new mentors
  if (hasProfile === false) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <User className="h-8 w-8 text-[#005EB8]" />
                Daftar Sebagai Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lengkapi data diri Anda untuk mendaftar sebagai mentor
              </p>
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
            {/* Info Banner */}
            <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8]/10 to-[#005EB8]/5 border-[#005EB8]/20 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#005EB8] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Perhatian
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Setelah mengajukan pendaftaran, Anda harus menunggu persetujuan admin. 
                      Setelah disetujui, Anda akan mendapatkan akses penuh ke fitur mentor 
                      seperti membuat kursus dan melihat statistik.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Apply Form */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <Briefcase className="h-5 w-5 text-[#005EB8]" />
                  Informasi Mentor
                </CardTitle>
                <CardDescription>
                  Isi semua field yang diperlukan dengan lengkap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Headline */}
                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-gray-900 dark:text-white">Headline / Profesi *</Label>
                  <Input
                    id="headline"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="Contoh: Senior Web Developer dengan 10 tahun pengalaman"
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Jelaskan profesi atau spesialisasi Anda dalam satu kalimat
                  </p>
                </div>
                {/* Expertise */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Keahlian / Expertise *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="Tambahkan keahlian"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                    />
                    <Button 
                      type="button" 
                      onClick={addExpertise} 
                      size="icon" 
                      className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.expertise.map((exp, index) => (
                      <Badge key={index} className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 py-1 px-3">
                        {exp}
                        <button onClick={() => removeExpertise(index)} className="ml-2 hover:text-[#D93025] dark:hover:text-[#ff6b6b]">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {formData.expertise.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Minimal 1 keahlian diperlukan</p>
                  )}
                </div>
                {/* Experience & Education */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-gray-900 dark:text-white">Pengalaman (tahun) *</Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      min="1"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="5"
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-gray-900 dark:text-white">Pendidikan</Label>
                    <Input
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      placeholder="S1 Teknik Informatika"
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                    />
                  </div>
                </div>
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-900 dark:text-white">Bio / Tentang Anda *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Ceritakan tentang diri Anda, pengalaman, dan apa yang bisa Anda ajarkan..."
                    rows={4}
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                </div>
                {/* Social Links */}
                <div className="space-y-4">
                  <Label className="text-gray-900 dark:text-white">Link Sosial Media & Portofolio (opsional)</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#005EB8]" />
                        <Label htmlFor="website" className="text-sm text-gray-900 dark:text-white">Website</Label>
                      </div>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#005EB8]" />
                        <Label htmlFor="linkedin" className="text-sm text-gray-900 dark:text-white">LinkedIn</Label>
                      </div>
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-[#005EB8]" />
                        <Label htmlFor="twitter" className="text-sm text-gray-900 dark:text-white">Twitter</Label>
                      </div>
                      <Input
                        id="twitter"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        placeholder="https://twitter.com/username"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-[#005EB8]" />
                        <Label htmlFor="portfolio" className="text-sm text-gray-900 dark:text-white">Portfolio</Label>
                      </div>
                      <Input
                        id="portfolio"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                      />
                    </div>
                  </div>
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-900 dark:text-white">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                </div>
                {/* Submit Button */}
                <Button
                  onClick={handleApply}
                  disabled={saving}
                  className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Ajukan Pendaftaran Mentor
                </Button>
              </CardContent>
            </Card>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }
  // Profile View/Edit for existing mentors
  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <User className="h-8 w-8 text-[#005EB8]" />
                Profil Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola profil mentor Anda</p>
            </div>
            {profile?.status === "APPROVED" && (
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
                    {/* Button Batal - Style diubah seperti button Lihat Semua di dashboard */}
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
                      Simpan
                    </Button>
                  </div>
                )}
              </div>
            )}
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
          {/* Status Banners */}
          {profile?.status === "PENDING" && (
            <Card className="rounded-lg border bg-gradient-to-r from-[#F4B400]/10 to-[#F4B400]/5 border-[#F4B400]/20 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#F4B400] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Menunggu Persetujuan Admin
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pendaftaran mentor Anda sedang dalam proses review. Anda akan mendapatkan 
                      akses penuh setelah disetujui oleh admin. Silakan tunggu beberapa saat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {profile?.status === "REJECTED" && (
            <Card className="rounded-lg border bg-gradient-to-r from-[#D93025]/10 to-[#D93025]/5 border-[#D93025]/20 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-[#D93025] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Pendaftaran Ditolak
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.rejection_reason || "Silakan hubungi admin untuk informasi lebih lanjut."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Profile Header Card */}
          {profile && (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-[#005EB8]">
                      <AvatarImage src={profile.user?.avatar_url || ""} alt={profile.user?.full_name} />
                      <AvatarFallback className="text-3xl bg-[#005EB8] text-white">
                        {profile.user?.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profile.status === "APPROVED" && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 p-2 bg-[#005EB8] text-white rounded-full hover:bg-[#004A93] transition-colors disabled:opacity-50 shadow-md"
                      >
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.user?.full_name}
                      </h2>
                      {getStatusBadge(profile.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      {profile.user?.email}
                    </p>
                    {profile.headline && (
                      <p className="text-[#005EB8] font-medium mb-2">{profile.headline}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                      {profile.expertise?.map((exp, i) => (
                        <Badge key={i} className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Stats */}
                  {profile.status === "APPROVED" && (
                    <div className="w-full md:w-auto mt-4 md:mt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="p-2 bg-[#005EB8]/10 rounded-lg w-fit mx-auto mb-1">
                            <BookOpen className="h-4 w-4 text-[#005EB8]" />
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{profile.total_courses}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="p-2 bg-[#005EB8]/10 rounded-lg w-fit mx-auto mb-1">
                            <Users className="h-4 w-4 text-[#005EB8]" />
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{profile.total_students}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="p-2 bg-[#F4B400]/10 rounded-lg w-fit mx-auto mb-1">
                            <Star className="h-4 w-4 text-[#F4B400]" />
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {profile.average_rating > 0 ? profile.average_rating.toFixed(1) : "-"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="p-2 bg-[#008A00]/10 rounded-lg w-fit mx-auto mb-1">
                            <DollarSign className="h-4 w-4 text-[#008A00]" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[100px] mx-auto">
                            {formatCurrency(profile.total_revenue)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Edit Form */}
          {profile && isEditing && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Professional Info */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Briefcase className="h-5 w-5 text-[#005EB8]" />
                    Detail Profesional
                  </CardTitle>
                  <CardDescription>Informasi profesional Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline" className="text-gray-900 dark:text-gray-100">Headline</Label>
                    <Input 
                      id="headline" 
                      name="headline" 
                      value={formData.headline} 
                      onChange={handleChange} 
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-gray-100">Keahlian</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={newExpertise} 
                        onChange={(e) => setNewExpertise(e.target.value)} 
                        placeholder="Tambah keahlian" 
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                      />
                      <Button 
                        type="button" 
                        onClick={addExpertise} 
                        size="icon" 
                        className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.expertise.map((exp, i) => (
                        <Badge key={i} className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 py-1">
                          {exp}
                          <button 
                            onClick={() => removeExpertise(i)} 
                            className="ml-2 hover:text-[#D93025] dark:hover:text-[#ff6b6b]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-gray-900 dark:text-gray-100">Pengalaman (tahun)</Label>
                      <Input 
                        id="experience" 
                        name="experience" 
                        type="number" 
                        value={formData.experience} 
                        onChange={handleChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education" className="text-gray-900 dark:text-gray-100">Pendidikan</Label>
                      <Input 
                        id="education" 
                        name="education" 
                        value={formData.education} 
                        onChange={handleChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-900 dark:text-gray-100">Bio</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      rows={4}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Links & Contact */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <LinkIcon className="h-5 w-5 text-[#005EB8]" />
                    Link & Kontak
                  </CardTitle>
                  <CardDescription>Informasi kontak dan sosial media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-900 dark:text-gray-100">Telepon</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-900 dark:text-gray-100">Website</Label>
                    <Input 
                      id="website" 
                      name="website" 
                      value={formData.website} 
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-gray-900 dark:text-gray-100">LinkedIn</Label>
                    <Input 
                      id="linkedin" 
                      name="linkedin" 
                      value={formData.linkedin} 
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-gray-900 dark:text-gray-100">Twitter</Label>
                    <Input 
                      id="twitter" 
                      name="twitter" 
                      value={formData.twitter} 
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio" className="text-gray-900 dark:text-gray-100">Portfolio</Label>
                    <Input 
                      id="portfolio" 
                      name="portfolio" 
                      value={formData.portfolio} 
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* View Mode - Details */}
          {profile && !isEditing && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Briefcase className="h-5 w-5 text-[#005EB8]" />
                    Detail Profesional
                  </CardTitle>
                  <CardDescription>Informasi profesional Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Pengalaman</span>
                    <span className="font-medium text-gray-900 dark:text-white">{profile.experience} tahun</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Pendidikan</span>
                    <span className="font-medium text-gray-900 dark:text-white">{profile.education || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Total Review</span>
                    <span className="font-medium text-gray-900 dark:text-white">{profile.total_reviews}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Bergabung</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 dark:text-gray-400">Bio</span>
                    <span className="font-medium text-gray-900 dark:text-white">{profile.bio || "-"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <LinkIcon className="h-5 w-5 text-[#005EB8]" />
                    Link & Kontak
                  </CardTitle>
                  <CardDescription>Informasi kontak dan sosial media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Telepon</span>
                    <span className="font-medium text-gray-900 dark:text-white">{profile.user?.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Website</span>
                    {profile.website ? (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#005EB8] hover:text-[#004A93] hover:underline"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">LinkedIn</span>
                    {profile.linkedin ? (
                      <a 
                        href={profile.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#005EB8] hover:text-[#004A93] hover:underline"
                      >
                        Lihat Profil
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Twitter</span>
                    {profile.twitter ? (
                      <a 
                        href={profile.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#005EB8] hover:text-[#004A93] hover:underline"
                      >
                        Lihat Profil
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 dark:text-gray-400">Portfolio</span>
                    {profile.portfolio ? (
                      <a 
                        href={profile.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#005EB8] hover:text-[#004A93] hover:underline"
                      >
                        Lihat Portfolio
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Account Info Card for mentors */}
          {profile && (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5 text-[#005EB8]" />
                  Informasi Akun
                </CardTitle>
                <CardDescription>Detail akun Anda (tidak dapat diubah)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#005EB8]" />
                        <p className="font-medium text-gray-900 dark:text-white">{profile.user?.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#F4B400]" />
                        <Badge className={profile.status === "APPROVED" ? 
                          "bg-[#008A00] text-white border border-[#008A00] pointer-events-none" : 
                          "bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none"}>
                          {profile.status === "APPROVED" ? "Disetujui" : profile.status === "PENDING" ? "Menunggu Persetujuan" : "Ditolak"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Terakhir Login</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#008A00]" />
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.updated_at ? formatDate(profile.updated_at) : "-"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
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
      </MentorLayout>
    </ProtectedRoute>
  );
}