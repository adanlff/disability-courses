"use client";

import Link from "next/link";
import NeuButton from "@/components/ui/new-button";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee";
import { 
  Star, 
  Quote, 
  ArrowRight,
  MessageSquare
} from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ahmad Rizki",
    role: "Pengguna Tunanetra",
    rating: 5,
    text: "Dengan screen reader yang optimal, saya bisa belajar programming dengan lancar. Fitur aksesibilitasnya sangat membantu!",
  },
  {
    id: 2,
    name: "Sari Dewi",
    role: "Pengguna Tunarungu",
    rating: 5,
    text: "Subtitle dan transkrip yang lengkap membuat saya memahami materi video dengan mudah. Terima kasih!",
  },
  {
    id: 3,
    name: "Budi Santoso",
    role: "Pengguna Disabilitas Motorik",
    rating: 5,
    text: "Navigasi keyboard yang intuitif memudahkan saya mengoperasikan platform tanpa kesulitan.",
  },
  {
    id: 4,
    name: "Maya Wati",
    role: "Pengguna Low Vision",
    rating: 5,
    text: "Ukuran teks yang bisa disesuaikan sangat membantu mata saya. Pengalaman belajar jadi lebih nyaman.",
  },
  {
    id: 5,
    name: "Rizky Pratama",
    role: "Pengguna Disleksia",
    rating: 5,
    text: "Font yang digunakan mudah dibaca dan kontras warna sangat membantu dalam proses belajar.",
  },
  {
    id: 6,
    name: "Diana Putri",
    role: "Pengguna Tunarungu",
    rating: 5,
    text: "Interpreter bahasa isyarat dalam video membuat pemahaman materi menjadi lebih baik.",
  },
  {
    id: 7,
    name: "Fajar Nugraha",
    role: "Pengguna Tunanetra",
    rating: 5,
    text: "Platform ini benar-benar mengubah cara saya belajar. Aksesibilitasnya sangat memukau!",
  },
  {
    id: 8,
    name: "Linda Sari",
    role: "Pengguna Disabilitas Motorik",
    rating: 5,
    text: "Saya bisa menyelesaikan kursus lengkap hanya dengan menggunakan keyboard. Luar biasa!",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[#005EB8]',
      'bg-[#008A00]',
      'bg-[#F4B400]',
      'bg-[#D93025]',
      'bg-[#673AB7]',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card className="h-full rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 mx-2">
      <CardContent className="p-5 space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start">
          <Quote className="h-6 w-6 text-[#005EB8]/20" />
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < testimonial.rating
                    ? "text-[#F4B400] fill-[#F4B400]"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm flex-grow">
          "{testimonial.text}"
        </p>

        {/* User Info */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className={`h-10 w-10 rounded-full ${getAvatarColor(testimonial.name)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
            {testimonial.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {testimonial.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {testimonial.role}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestimonialSection() {
  const firstColumn = testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const secondColumn = testimonials.slice(Math.ceil(testimonials.length / 2));

  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4B400]/10 text-[#F4B400] text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Ulasan Pengguna
            </span>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Apa Kata Mereka Tentang{" "}
              <span className="text-[#005EB8]">Pengalaman Belajar</span>
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Dengarkan langsung dari komunitas yang telah merasakan manfaat platform pembelajaran inklusif kami. Setiap cerita adalah bukti komitmen kami.
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Link href="/courses">
                <NeuButton className="group flex items-center justify-center gap-2">
                  Lihat Semua Kursus
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </NeuButton>
              </Link>
            </div>
          </div>

          {/* Right Side - Testimonials Marquee */}
          <div className="relative h-[400px] sm:h-[500px] lg:h-[550px] overflow-hidden">
            {/* Mobile: Single Column */}
            <div className="block lg:hidden h-full">
              <Marquee
                vertical
                pauseOnHover
                repeat={4}
                className="[--duration:60s] h-full"
              >
                {testimonials.map((testimonial) => (
                  <div key={`mobile-${testimonial.id}`} className="mb-4 px-1">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                ))}
              </Marquee>
            </div>

            {/* Desktop: Two Columns */}
            <div className="hidden lg:flex gap-4 h-full">
              <div className="flex-1 h-full overflow-hidden">
                <Marquee
                  vertical
                  pauseOnHover
                  repeat={3}
                  className="[--duration:80s]"
                >
                  {firstColumn.map((testimonial) => (
                    <div key={`first-${testimonial.id}`} className="mb-4">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  ))}
                </Marquee>
              </div>

              <div className="flex-1 h-full overflow-hidden">
                <Marquee
                  vertical
                  reverse
                  pauseOnHover
                  repeat={3}
                  className="[--duration:80s]"
                >
                  {secondColumn.map((testimonial) => (
                    <div key={`second-${testimonial.id}`} className="mb-4">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  ))}
                </Marquee>
              </div>
            </div>

            {/* Gradient Overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white dark:from-gray-900 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}