"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ForgotPasswordPage,
  Testimonial,
} from "@/components/auth/forgot-password";
import { SuccessModal } from "@/components/modal/forgot-password-modal";

export default function ForgotPasswordPageComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Get email from form
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    setEmail(emailValue);

    try {
      // Validate email format first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        setError("Email tidak valid");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map backend errors to user-friendly messages
        let errorMessage = "Terjadi kesalahan saat mengirim reset password";

        if (
          data.message?.toLowerCase().includes("user not found") ||
          data.error?.toLowerCase().includes("user not found") ||
          data.message?.toLowerCase().includes("not registered") ||
          data.message?.toLowerCase().includes("tidak terdaftar") ||
          data.message?.toLowerCase().includes("email tidak terdaftar")
        ) {
          errorMessage = "Email tidak terdaftar di sistem kami";
        } else if (
          data.message?.toLowerCase().includes("invalid email") ||
          data.error?.toLowerCase().includes("invalid email") ||
          data.message?.toLowerCase().includes("email tidak valid")
        ) {
          errorMessage = "Email tidak valid";
        } else if (
          data.message?.toLowerCase().includes("failed to send email") ||
          data.error?.toLowerCase().includes("failed to send email") ||
          data.message?.toLowerCase().includes("gagal mengirim email")
        ) {
          errorMessage = "Gagal mengirim email reset, coba lagi nanti";
        } else if (
          data.message?.toLowerCase().includes("too many requests") ||
          data.error?.toLowerCase().includes("too many requests") ||
          data.message?.toLowerCase().includes("terlalu banyak permintaan") ||
          data.message?.toLowerCase().includes("rate limit")
        ) {
          errorMessage =
            "Terlalu banyak permintaan reset, coba lagi dalam 30 menit";
        } else if (data.message) {
          errorMessage = data.message;
        }

        setError(errorMessage);
        return;
      }

      // Success - show modal
      setSubmittedEmail(emailValue);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Forgot password request failed:", error);
      setError(
        "Terjadi kesalahan saat mengirim reset password. Silakan coba lagi nanti."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Reset form state
    setEmail("");
    setError(null);
  };

  return (
    <div className="relative">
      {/* Success Modal */}
      <SuccessModal
        email={submittedEmail}
        onClose={handleCloseModal}
        onBackToLogin={handleBackToLogin}
        isOpen={showSuccessModal}
      />

      <ForgotPasswordPage
        title="Lupa Password"
        description="Masukkan email Anda untuk reset password"
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