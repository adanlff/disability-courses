import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import AccessibilityWidget from "@/components/accessibility/accessibility-overlay";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Online Course Disabilitas - Platform Pembelajaran Inklusif",
  description:
    "Platform pembelajaran online yang dirancang khusus untuk penyandang disabilitas dengan fitur aksesibilitas lengkap",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <AccessibilityWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}