"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RegisterPage,
  Testimonial,
  RegisterFormData,
  DisabilityType,
} from "@/components/auth/register";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

export default function RegisterPageComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "error",
    title: "",
    message: "",
  });
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

  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  const handleRegister = async (formData: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Prepare data for API call
      const payload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        disability_type: formData.disability_type,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages
        if (data.error === "Email sudah terdaftar") {
          showSweetAlert("error", "Registrasi Gagal", "Email sudah terdaftar.");
          return;
        }
        
        if (data.details) {
          const errorMessages = Object.values(data.details).flat().join("\n");
          throw new Error(errorMessages);
        }

        throw new Error(data.error || "Terjadi kesalahan pada server");
      }

      // Registration successful
      console.log("Registrasi berhasil:", data);

      // Show success alert
      showSweetAlert(
        "success", 
        "Registrasi Berhasil!", 
        "Silakan periksa email Anda untuk verifikasi akun. Anda harus verifikasi email terlebih dahulu sebelum dapat menggunakan akun."
      );

      // Redirect to verify email page after delay
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }, 3000);
    } catch (error) {
      console.error("Registrasi gagal:", error);

      // Show generic error alert
      showSweetAlert(
        "error",
        "Registrasi Gagal",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan pada server, coba lagi nanti."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div>
      {/* Sweet Alert Component */}
      <SweetAlert
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        duration={alertConfig.type === "success" ? 3000 : 5000}
        showCloseButton={true}
      />

      <RegisterPage
        title="Buat Akun Baru"
        description="Daftar untuk memulai perjalanan pembelajaran Anda"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onRegister={handleRegister}
        onLogin={handleLogin}
        isLoading={isLoading}
      />
    </div>
  );
}