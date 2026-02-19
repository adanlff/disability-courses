'use client';

import { Dispatch, SetStateAction, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Card, CardContent } from "@/components/ui/card";
import { 
  HelpCircle,
  Volume2,
  Monitor,
  Type,
  MousePointer,
  Eye,
  LucideIcon
} from "lucide-react";

interface FAQItem {
  id: number;
  title: string;
  Icon: LucideIcon;
  imgSrc: string;
  description: string;
  color: string;
}

const items: FAQItem[] = [
  {
    id: 1,
    title: "Apa itu Text-to-Speech?",
    Icon: Volume2,
    imgSrc: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    description: "Text-to-Speech (TTS) adalah fitur yang membacakan teks secara otomatis. Anda dapat mengatur kecepatan bicara, volume, dan memilih suara yang diinginkan untuk membantu memahami konten.",
    color: "bg-[#005EB8]"
  },
  {
    id: 2,
    title: "Bagaimana Font Disleksia?",
    Icon: Type,
    imgSrc: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80",
    description: "Font OpenDyslexic adalah font khusus yang dirancang untuk membantu pengguna disleksia membaca dengan lebih mudah. Bagian bawah huruf dibuat lebih tebal untuk membantu orientasi.",
    color: "bg-[#008A00]"
  },
  {
    id: 3,
    title: "Pengaturan Visual?",
    Icon: Monitor,
    imgSrc: "https://images.unsplash.com/photo-1578450671530-5b6a7c9f32a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80",
    description: "Anda dapat menyesuaikan kecerahan, saturasi, kontras tampilan, mengaktifkan mode grayscale atau balik warna untuk kenyamanan penglihatan sesuai kebutuhan Anda.",
    color: "bg-[#F4B400]"
  },
  {
    id: 4,
    title: "Mode Kontras Tinggi?",
    Icon: Eye,
    imgSrc: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    description: "Mode kontras tinggi meningkatkan perbedaan warna antara teks dan latar belakang, membantu pengguna low vision untuk membaca konten dengan lebih jelas.",
    color: "bg-[#005EB8]"
  },
  {
    id: 5,
    title: "Panduan Baca & Fokus?",
    Icon: HelpCircle,
    imgSrc: "https://images.unsplash.com/photo-1581276879432-15e50529f34b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    description: "Panduan Baca menampilkan garis horizontal yang mengikuti kursor untuk membantu membaca baris per baris. Mode Fokus memberikan highlight pada elemen yang sedang aktif.",
    color: "bg-[#008A00]"
  },
  {
    id: 6,
    title: "Ukuran Kursor?",
    Icon: MousePointer,
    imgSrc: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
    description: "Perbesar ukuran kursor menjadi Besar atau Ekstra Besar untuk memudahkan navigasi, terutama bagi pengguna dengan kesulitan motorik atau penglihatan terbatas.",
    color: "bg-[#F4B400]"
  }
];

interface PanelProps {
  open: number;
  setOpen: Dispatch<SetStateAction<number>>;
  id: number;
  Icon: LucideIcon;
  title: string;
  imgSrc: string;
  description: string;
  color: string;
}

const Panel = ({
  open,
  setOpen,
  id,
  Icon,
  title,
  imgSrc,
  description,
  color,
}: PanelProps) => {
  const { width } = useWindowSize();
  const isOpen = open === id;

  return (
    <>
      <button
        className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors p-4 border-r border-b border-gray-200 dark:border-gray-700 flex flex-row-reverse lg:flex-col justify-end items-center gap-4 relative group min-w-[80px] ${
          isOpen ? 'bg-gray-50 dark:bg-gray-700' : ''
        }`}
        onClick={() => setOpen(id)}
      >
        <span
          style={{ writingMode: "vertical-lr" }}
          className="hidden lg:block text-base font-semibold text-gray-900 dark:text-white rotate-180"
        >
          {title}
        </span>
        <span className="block lg:hidden text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-lg ${color} text-white grid place-items-center transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="w-3 h-3 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 transition-colors border-r border-b lg:border-b-0 lg:border-t border-gray-200 dark:border-gray-700 rotate-45 absolute bottom-0 lg:bottom-[50%] right-[50%] lg:right-0 translate-y-[50%] translate-x-[50%] z-20" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={`panel-${id}`}
            variants={width && width > 1024 ? panelVariants : panelVariantsSm}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              backgroundImage: `url(${imgSrc})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
            className="w-full h-full overflow-hidden relative bg-black flex items-end"
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              variants={descriptionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative z-10 px-6 py-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-white w-full"
            >
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const panelVariants = {
  open: { width: "100%", height: "100%" },
  closed: { width: "0%", height: "100%" },
};

const panelVariantsSm = {
  open: { width: "100%", height: "280px" },
  closed: { width: "100%", height: "0px" },
};

const descriptionVariants = {
  open: {
    opacity: 1,
    y: "0%",
    transition: { delay: 0.125 },
  },
  closed: { opacity: 0, y: "100%" },
};

export default function FAQSection() {
  const [open, setOpen] = useState(items[0].id);

  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005EB8]/10 text-[#005EB8] text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ Aksesibilitas
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pertanyaan Umum Aksesibilitas
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Jawaban untuk pertanyaan umum seputar aksesibilitas dan dukungan untuk pengguna disabilitas
          </p>
        </div>

        {/* Accordion Card */}
        <Card className="w-full max-w-6xl mx-auto overflow-hidden rounded-lg border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row h-fit lg:h-[450px] w-full">
            {items.map((item) => (
              <Panel
                key={item.id}
                open={open}
                setOpen={setOpen}
                id={item.id}
                Icon={item.Icon}
                title={item.title}
                imgSrc={item.imgSrc}
                description={item.description}
                color={item.color}
              />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}