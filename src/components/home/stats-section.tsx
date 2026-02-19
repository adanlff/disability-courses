"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  Award, 
  Star,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlatformStats {
  total_students: number;
  total_courses: number;
  total_certificates: number;
  total_reviews: number;
  average_rating: number;
}

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

export default function StatsSection() {
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

  const displayStats: Stat[] = [
    {
      icon: Users,
      value: `${stats.total_students.toLocaleString('id-ID')}+`,
      label: 'Siswa Aktif',
      description: 'Bergabung dalam komunitas',
      color: 'text-[#005EB8]',
      bgColor: 'bg-[#005EB8]/10',
    },
    {
      icon: BookOpen,
      value: `${stats.total_courses}+`,
      label: 'Kursus Tersedia',
      description: 'Berbagai topik & level',
      color: 'text-[#008A00]',
      bgColor: 'bg-[#008A00]/10',
    },
    {
      icon: Award,
      value: `${stats.total_certificates.toLocaleString('id-ID')}+`,
      label: 'Sertifikat',
      description: 'Telah diterbitkan',
      color: 'text-[#F4B400]',
      bgColor: 'bg-[#F4B400]/10',
    },
    {
      icon: Star,
      value: `${stats.average_rating.toFixed(1)}/5`,
      label: 'Rating',
      description: `Dari ${stats.total_reviews.toLocaleString('id-ID')} ulasan`,
      color: 'text-[#005EB8]',
      bgColor: 'bg-[#005EB8]/10',
    },
  ];
  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fadeIn">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#008A00]/10 text-[#008A00] text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4" />
            Statistik Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dipercaya oleh Ribuan Pelajar
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Bergabunglah dengan komunitas pembelajaran yang terus berkembang dan raih tujuan pendidikan Anda.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayStats.map((stat, index) => (
            <Card
              key={index}
              className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-3">
                {/* Icon */}
                <div className={`h-14 w-14 mx-auto rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                
                {/* Value */}
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                
                {/* Label */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {stat.label}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}