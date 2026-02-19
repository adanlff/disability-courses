'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, GraduationCap, Briefcase, Globe, Linkedin, Twitter, Clock, CheckCircle, XCircle, Star, BookOpen, Users, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MentorProfile {
  id: string;
  expertise: string[];
  experience: number;
  education: string | null;
  bio: string | null;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  portfolio: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_revenue: number;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone?: string | null;
  };
}

interface MentorDetailModalProps {
  mentor: MentorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (mentorId: string) => void;
  onReject?: (mentorId: string) => void;
  isSubmitting?: boolean;
}

export const MentorDetailModal: React.FC<MentorDetailModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen || !mentor) return null;

  const getStatusBadge = () => {
    switch (mentor.status) {
      case 'APPROVED':
        return {
          text: 'Terverifikasi',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-100 dark:border-green-800'
        };
      case 'REJECTED':
        return {
          text: 'Ditolak',
          icon: <XCircle className="w-3.5 h-3.5" />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-100 dark:border-red-800'
        };
      default:
        return {
          text: 'Menunggu Persetujuan',
          icon: <Clock className="w-3.5 h-3.5" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          borderColor: 'border-yellow-100 dark:border-yellow-800'
        };
    }
  };

  const statusBadge = getStatusBadge();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
      <Card 
        className="relative w-full max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - compact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detail Mentor
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Informasi lengkap profil mentor
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Konten utama - compact height */}
        <CardContent className="p-5 space-y-5 overflow-y-auto">
          {/* Profil Mentor - compact */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-blue-500">
                {mentor.user.avatar_url ? (
                  <img
                    src={mentor.user.avatar_url}
                    alt={mentor.user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {mentor.user.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mentor.headline || 'Mentor'}
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor} border`}>
                  {statusBadge.icon}
                  {statusBadge.text}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Bergabung {formatDate(mentor.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  {mentor.experience} tahun pengalaman
                </span>
              </div>
            </div>
          </div>

          {/* Statistik - compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Card className="rounded-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{mentor.total_courses}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kursus</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(mentor.total_students)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <Star className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {mentor.average_rating > 0 ? mentor.average_rating.toFixed(1) : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(mentor.total_revenue)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pendapatan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two-column layout for details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Informasi Kontak */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Informasi Kontak
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-white dark:bg-gray-700 rounded-md mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{mentor.user.email}</p>
                    </div>
                  </div>

                  {mentor.user.phone && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-white dark:bg-gray-700 rounded-md mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Telepon</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{mentor.user.phone}</p>
                      </div>
                    </div>
                  )}

                  {mentor.website && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-white dark:bg-gray-700 rounded-md mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Website</p>
                        <a 
                          href={mentor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {mentor.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {mentor.linkedin && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-white dark:bg-gray-700 rounded-md mt-0.5">
                        <Linkedin className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">LinkedIn</p>
                        <a 
                          href={mentor.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {mentor.linkedin}
                        </a>
                      </div>
                    </div>
                  )}

                  {mentor.twitter && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-white dark:bg-gray-700 rounded-md mt-0.5">
                        <Twitter className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Twitter</p>
                        <a 
                          href={mentor.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {mentor.twitter}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Informasi Profesional */}
            <div className="space-y-4">
              {/* Pendidikan */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <GraduationCap className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Pendidikan
                  </h3>
                </div>
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {mentor.education || 'Tidak ada informasi pendidikan'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pengalaman Kerja */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                    <Briefcase className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Pengalaman Kerja
                  </h3>
                </div>
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {mentor.experience} tahun pengalaman profesional
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Keahlian */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <Star className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Keahlian
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    {mentor.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.map((exp, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md border border-blue-100 dark:border-blue-800"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada keahlian terdaftar</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tentang Mentor */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                    <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Tentang Mentor
                  </h3>
                </div>
                
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {mentor.bio || 'Tidak ada deskripsi bio'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Alasan Penolakan - only show if rejected */}
              {mentor.status === 'REJECTED' && mentor.rejection_reason && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Alasan Penolakan
                    </h3>
                  </div>
                  
                  <Card className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-3">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {mentor.rejection_reason}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Tombol Aksi */}
          {mentor.status === 'PENDING' && onApprove && onReject && (
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => onApprove(mentor.id)}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Setujui Mentor
              </button>
              
              <button
                onClick={() => onReject(mentor.id)}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Tolak Mentor
              </button>
            </div>
          )}

          {mentor.status !== 'PENDING' && (
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={onClose}
                className="border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
              >
                Tutup
              </button>
            </div>
          )}
        </CardContent>

        {/* Footer - compact */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Mentor ID: {mentor.id} • Terakhir diperbarui: {formatDate(mentor.created_at)}
          </p>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MentorDetailModal;