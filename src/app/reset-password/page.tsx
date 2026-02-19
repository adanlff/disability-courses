"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordPage, Testimonial } from "@/components/auth/reset-password";
import { ResetPasswordSuccessModal } from "@/components/modal/reset-password-modal";

export default function ResetPasswordPageComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sample testimonials data
  const sampleTestimonials: Testimonial[] = [
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

  useEffect(() => {
    // Get token from URL query parameters
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token reset password tidak ditemukan. Silakan minta link reset password baru.");
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (newPassword: string) => {
    if (!token) {
      setError("Token reset password tidak valid");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Gagal mengubah password";
        
        if (data.message?.includes("Invalid or expired reset token")) {
          errorMessage = "Token reset password tidak valid atau sudah kadaluarsa";
        } else if (data.message?.includes("Password must be at least 8 characters long")) {
          errorMessage = "Password minimal 8 karakter";
        } else if (data.message) {
          errorMessage = data.message;
        }

        setError(errorMessage);
        return;
      }

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Reset password failed:', error);
      setError("Terjadi kesalahan saat mengubah password. Silakan coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    handleBackToLogin();
  };

  // Don't render page if token hasn't been retrieved or is invalid
  if (token === null) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memeriksa token reset password...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Token Tidak Valid</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleBackToLogin}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Success Modal */}
      <ResetPasswordSuccessModal
        onClose={handleCloseModal}
        onBackToLogin={handleBackToLogin}
        isOpen={showSuccessModal}
      />

      <ResetPasswordPage
        title="Reset Password"
        description="Masukkan password baru Anda"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onSubmit={handleSubmit}
        onBackToLogin={handleBackToLogin}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}