"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// This page is no longer used — password reset flow is now handled
// via OTP in /forgot-password. Redirect anyone who lands here.
export default function ResetPasswordPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
    </div>
  );
}
