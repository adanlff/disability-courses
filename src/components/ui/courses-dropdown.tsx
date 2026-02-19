"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownCard,
  DropdownCardContent,
} from "@/components/ui/dropdown-card";
import NeuButton from "@/components/ui/new-button";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface CoursesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoursesDropdown({
  isOpen,
  onClose,
}: CoursesDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [freeCourses, setFreeCourses] = useState<Course[]>([]);
  const [paidCourses, setPaidCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses?status=PUBLISHED&limit=12');
        if (response.ok) {
          const data = await response.json();
          const courses = data.courses || data.data || [];
          
          // Separate free and paid courses
          const free = courses.filter((c: Course) => c.price === 0).slice(0, 6);
          const paid = courses.filter((c: Course) => c.price > 0).slice(0, 6);
          
          setFreeCourses(free);
          setPaidCourses(paid);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setIsClosing(false);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Prevent close when clicking inside dropdown
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full left-0 mt-3.5 z-50 transition-all duration-300 ease-out ${
        isClosing
          ? "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          : "opacity-100 scale-100 translate-y-0"
      }`}
      onClick={handleDropdownClick}
    >
      <DropdownCard className="w-[850px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DropdownCardContent className="p-0">
          <div className="flex">
            {/* Left Side - Image dengan teks */}
            <div className="w-2/5 relative">
              <Image
                src="/landing page/image.png"
                alt="Akses Pembelajaran Inklusif"
                width={340}
                height={240}
                className="object-cover w-full h-full"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/40 flex items-end p-6">
                <div className="text-white space-y-3 w-full">
                  <div className="text-[#008A00] text-sm font-bold tracking-wide">
                    Trusted by 10K+ Students
                  </div>

                  <h3 className="text-xl font-bold text-white leading-tight">
                    Build Your Future Career
                  </h3>

                  <p className="text-white/90 text-sm leading-relaxed">
                    Explore kelas gratis dan berbagai bersama mentor expert
                  </p>

                  <Link href="/courses" onClick={handleClose}>
                    <NeuButton className="font-semibold py-2 px-5 text-sm mt-2">
                      Semua Kursus
                    </NeuButton>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side - Courses List */}
            <div className="w-3/5 p-5">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                </div>
              ) : (
                <>
                  {/* Free Courses Section */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-6 bg-[#008A00] rounded-full"></div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          Kursus Gratis
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Mulai belajar tanpa biaya
                        </p>
                      </div>
                    </div>

                    {freeCourses.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {freeCourses.map((course) => (
                            <Link
                              key={course.id}
                              href={`/courses/${course.slug}`}
                              className="group relative overflow-hidden bg-gradient-to-r from-[#008A00]/5 to-[#008A00]/10 dark:from-[#008A00]/10 dark:to-[#008A00]/15 rounded-lg p-2 border border-[#008A00]/20 hover:border-[#008A00]/40 transition-all duration-300"
                              onClick={handleClose}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#008A00] rounded-full"></div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#008A00] transition-colors duration-300 line-clamp-1">
                                  {course.title}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/courses?price=free"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#008A00] hover:text-[#006600] transition-all duration-300 group"
                          onClick={handleClose}
                        >
                          Lihat semua kursus gratis
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            →
                          </span>
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada kursus gratis</p>
                    )}
                  </div>

                  {/* Paid Courses Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-6 bg-[#005EB8] rounded-full"></div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          Kursus Berbayar
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Akses konten premium lengkap
                        </p>
                      </div>
                    </div>

                    {paidCourses.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {paidCourses.map((course) => (
                            <Link
                              key={course.id}
                              href={`/courses/${course.slug}`}
                              className="group relative overflow-hidden bg-gradient-to-r from-[#005EB8]/5 to-[#005EB8]/10 dark:from-[#005EB8]/10 dark:to-[#005EB8]/15 rounded-lg p-2 border border-[#005EB8]/20 hover:border-[#005EB8]/40 transition-all duration-300"
                              onClick={handleClose}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full"></div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#005EB8] transition-colors duration-300 line-clamp-1">
                                  {course.title}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/courses?price=paid"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#005EB8] hover:text-[#004A93] transition-all duration-300 group"
                          onClick={handleClose}
                        >
                          Lihat semua kursus berbayar
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            →
                          </span>
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada kursus berbayar</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DropdownCardContent>
      </DropdownCard>
    </div>
  );
}
