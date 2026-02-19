"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Client-side getCookie function
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Try localStorage first, then cookie
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = getCookie("accessToken");
      }
      
      // Redirect ke login jika tidak ada token
      if (!token) {
        router.push("/login");
        return;
      }

      // Jika tidak ada role restriction, langsung authorize
      if (allowedRoles.length === 0) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Cek role dari user data
      let userStr = localStorage.getItem("user");
      if (!userStr) {
        userStr = getCookie("user");
      }
      
      if (!userStr) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const userRole = (user.role || user.user_role || "").toUpperCase();
        
        // Cek apakah role diizinkan
        const hasAccess = allowedRoles.some(allowedRole => 
          allowedRole.toUpperCase() === userRole
        );
        
        if (hasAccess) {
          setIsAuthorized(true);
          setIsLoading(false);
        } else {
          // Redirect ke dashboard sesuai role
          if (userRole === "ADMIN") {
            router.push("/admin/dashboard");
          } else if (userRole === "MENTOR") {
            router.push("/mentor/dashboard");
          } else {
            router.push("/user/dashboard");
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

