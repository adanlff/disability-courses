"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NeuButton from "@/components/ui/new-button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Play, 
  Users, 
  Award, 
  GraduationCap,
  CheckCircle
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";

interface PlatformStats {
  total_students: number;
  total_courses: number;
  total_certificates: number;
  total_reviews: number;
  average_rating: number;
}

export default function HeroSection() {
  const [stats, setStats] = useState<PlatformStats>({
    total_students: 0,
    total_courses: 0,
    total_certificates: 0,
    total_reviews: 0,
    average_rating: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Calculate satisfaction percentage from rating (5 = 100%)
  const satisfactionPercent = stats.average_rating > 0 
    ? Math.round((stats.average_rating / 5) * 100) 
    : 0;

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 lg:pt-8 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-fadeIn">
            {/* Badge */}
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005EB8]/10 text-[#005EB8] text-sm font-medium border border-[#005EB8]/20">
                <GraduationCap className="h-4 w-4" />
                Platform Pembelajaran Inklusif #1
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Belajar Tanpa Batas untuk{" "}
              <span className="text-[#005EB8]">Semua Orang</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Platform pembelajaran online yang dirancang khusus dengan fitur
              aksesibilitas lengkap. Belajar dengan nyaman sesuai kebutuhan
              Anda, kapan saja dan di mana saja.
            </p>

            {/* Features List */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#008A00]" />
                <span>Screen Reader Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#008A00]" />
                <span>Subtitle Lengkap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#008A00]" />
                <span>Sertifikat Resmi</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register">
                <NeuButton className="group flex items-center justify-center gap-2">
                  Mulai Belajar Gratis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </NeuButton>
              </Link>
              <Link href="/courses">
                <NeuButton className="group flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" />
                  Jelajahi Kursus
                </NeuButton>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  <NumberTicker value={stats.total_students} />+
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Siswa Aktif</p>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  <NumberTicker value={stats.total_courses} />+
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  <NumberTicker value={satisfactionPercent} />%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kepuasan</p>
              </div>
            </div>
          </div>

          {/* Right Content - Cards */}
          <div className="relative animate-fadeIn delay-200">
            {/* Main Card */}
            <Card className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <Image
                  src="/landing page/image.png"
                  alt="Akses Pembelajaran Inklusif - Dirancang untuk semua kemampuan"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Card>

            {/* Floating Card - Bottom Right */}
            <Card className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 animate-scaleIn delay-400 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#008A00]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-[#008A00]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      Komunitas Aktif
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {stats.total_students.toLocaleString('id-ID')}+ pelajar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Card - Top Left */}
            <Card className="absolute -top-4 -left-4 lg:-top-6 lg:-left-6 animate-scaleIn delay-300 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#F4B400]/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-[#F4B400]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      Sertifikat Resmi
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Diakui industri
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}