import Link from "next/link";
import NeuButton from "@/components/ui/new-button";
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle,
  Zap
} from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-[#005EB8]/5 via-[#008A00]/5 to-[#F4B400]/5 dark:from-[#005EB8]/10 dark:via-[#008A00]/10 dark:to-[#F4B400]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-fadeIn">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Zap className="h-4 w-4 text-[#F4B400]" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Mulai Perjalanan Belajar Anda
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            Siap untuk Memulai Pembelajaran Anda?
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pelajar lainnya dan dapatkan akses ke
            ratusan kursus berkualitas dengan fitur aksesibilitas lengkap.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <NeuButton className="group flex items-center justify-center gap-2 w-full sm:w-auto">
                Daftar Sekarang - Gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </NeuButton>
            </Link>
            <Link href="/courses">
              <NeuButton className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Jelajahi Kursus
              </NeuButton>
            </Link>
          </div>

          {/* Features List */}
          <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#008A00]" />
              <span>Gratis untuk memulai</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#008A00]" />
              <span>Tidak perlu kartu kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#008A00]" />
              <span>Akses selamanya</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}