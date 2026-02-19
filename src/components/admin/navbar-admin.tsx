"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UserCircle, 
  Settings, 
  LogOut, 
  Menu, 
  ListTodo
} from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

interface NavbarAdminProps {
  toggleSidebar: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Dropdown menu items - Logs dan Settings saja
const dropdownMenuItems = [
  {
    label: 'Logs',
    icon: ListTodo,
    link: '/admin/logs',
  },
  {
    label: 'Settings',
    icon: Settings,
    link: '/admin/settings',
  }
];

export default function NavbarAdmin({ toggleSidebar }: NavbarAdminProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // Get user data from localStorage on client side only
    try {
      const userDataString = localStorage.getItem("user");
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        console.warn("No access token found");
        showSweetAlert(
          "info",
          "Sesi Berakhir",
          "Sesi Anda telah berakhir. Silakan login kembali."
        );
        // Clear auth data immediately for session expired
        setTimeout(() => {
          clearAuthData();
        }, 2000);
        return;
      }

      // Send logout request to backend
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Logout failed with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Logout successful:", result);

      // Show success notification
      showSweetAlert(
        "success",
        "Logout Berhasil!",
        "Logout berhasil! Sampai jumpa kembali."
      );

      // Clear auth data after delay for notification
      setTimeout(() => {
        clearAuthData();
      }, 2000);
    } catch (error) {
      console.error("Error during logout:", error);
      let errorMessage = "Gagal logout. Silakan coba lagi.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = String(error.message);
      }

      showSweetAlert("error", "Logout Gagal", errorMessage);

      // Still clear auth data on error to ensure security
      setTimeout(() => {
        clearAuthData();
      }, 3000);
    } finally {
      setIsLoggingOut(false);
      setShowConfirmAlert(false);
    }
  };

  const clearAuthData = () => {
    // Remove all auth-related data from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Remove auth cookies
    document.cookie =
      "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Redirect to login page
    router.push("/login");
  };

  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  const confirmLogout = () => {
    setShowConfirmAlert(true);
  };

  // Show loading state during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <header className="bg-transparent">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <AnimatedThemeToggler />
              
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <>
      {/* SweetAlert Component untuk notifikasi biasa */}
      <SweetAlert
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        duration={alertConfig.type === "success" ? 2000 : 3000}
        showCloseButton={true}
      />

      {/* SweetAlert untuk konfirmasi logout (WARNA MERAH) */}
      <SweetAlert
        type="error"
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin logout dari akun Admin? Anda akan diarahkan ke halaman login."
        show={showConfirmAlert}
        onClose={() => setShowConfirmAlert(false)}
        duration={0} // Tidak auto close untuk konfirmasi
        showCloseButton={true}
      >
        {/* Tambahan tombol konfirmasi khusus untuk alert konfirmasi */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowConfirmAlert(false)}
            disabled={isLoggingOut}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {isLoggingOut ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sedang logout...
              </>
            ) : (
              "Ya, Logout"
            )}
          </button>
        </div>
      </SweetAlert>

      <header className="bg-transparent">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <AnimatedThemeToggler />

              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                  aria-label="Admin menu"
                >
                  <UserCircle className="h-8 w-8 text-[#005EB8]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                >
                  {/* User info in dropdown */}
                  {userData && (
                    <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {userData.name}
                      </p>
                      <div className="mt-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {userData.email}
                        </p>
                        <p className="text-[#005EB8] dark:text-blue-400 text-xs font-medium mt-1 capitalize">
                          {userData.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Logs dan Settings */}
                  <div className="py-1">
                    {dropdownMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={item.label}
                          asChild
                          className="cursor-pointer px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:!bg-[#005EB8] focus:!text-white"
                        >
                          <Link
                            href={item.link}
                            className="flex items-center gap-3 w-full"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>

                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  
                  {/* Logout (WARNA MERAH) */}
                  <DropdownMenuItem
                    onClick={confirmLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 cursor-pointer text-[#D93025] dark:text-red-400 focus:!bg-red-50 dark:focus:!bg-red-900/20 focus:!text-[#D93025] dark:focus:!text-red-400 px-3 py-2"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="h-4 w-4 border-2 border-[#D93025] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Logout</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}