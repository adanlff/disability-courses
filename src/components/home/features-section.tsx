import { 
  Monitor, 
  Volume2, 
  Type, 
  MousePointer, 
  Contrast, 
  Eye,
  Accessibility,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    icon: Volume2,
    title: 'Text-to-Speech',
    description: 'Fitur baca teks otomatis untuk memudahkan pengguna tunanetra mengakses konten dengan berbagai pilihan suara dan kecepatan.',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
  {
    icon: Type,
    title: 'Font Disleksia',
    description: 'Font OpenDyslexic khusus yang dirancang untuk membantu pengguna disleksia membaca dengan lebih mudah.',
    color: 'text-[#008A00]',
    bgColor: 'bg-[#008A00]/10',
  },
  {
    icon: Monitor,
    title: 'Pengaturan Visual',
    description: 'Sesuaikan kecerahan, saturasi, kontras, dan mode grayscale sesuai kebutuhan penglihatan Anda.',
    color: 'text-[#F4B400]',
    bgColor: 'bg-[#F4B400]/10',
  },
  {
    icon: MousePointer,
    title: 'Ukuran Kursor',
    description: 'Perbesar ukuran kursor untuk memudahkan navigasi bagi pengguna dengan kesulitan motorik.',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
  {
    icon: Contrast,
    title: 'Mode Kontras Tinggi',
    description: 'Tingkatkan kontras tampilan untuk pengguna low vision agar konten lebih mudah terbaca.',
    color: 'text-[#008A00]',
    bgColor: 'bg-[#008A00]/10',
  },
  {
    icon: Eye,
    title: 'Panduan Baca & Mode Fokus',
    description: 'Garis panduan mengikuti kursor dan mode fokus untuk membantu konsentrasi saat membaca.',
    color: 'text-[#F4B400]',
    bgColor: 'bg-[#F4B400]/10',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fadeIn">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005EB8]/10 text-[#005EB8] text-sm font-medium mb-4">
            <Accessibility className="h-4 w-4" />
            Fitur Aksesibilitas
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Fitur Aksesibilitas Lengkap
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Kami berkomitmen menyediakan pengalaman belajar yang inklusif untuk semua orang dengan berbagai kebutuhan aksesibilitas.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="h-full rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-4 h-full flex flex-col">
                {/* Icon */}
                <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed flex-grow text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}