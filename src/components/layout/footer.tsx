import Link from 'next/link';
import { 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Youtube,
  ExternalLink
} from 'lucide-react';

const footerLinks = {
  tentang: [
    { label: 'Tentang Kami', href: '/about' },
    { label: 'Kursus', href: '/courses' },
    { label: 'Instruktur', href: '/instructors' },
    { label: 'Blog', href: '/blog' },
  ],
  dukungan: [
    { label: 'Pusat Bantuan', href: '/help' },
    { label: 'Aksesibilitas', href: '/accessibility' },
    { label: 'Kebijakan Privasi', href: '/privacy' },
    { label: 'Syarat & Ketentuan', href: '/terms' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <BookOpen className="h-7 w-7 text-[#005EB8]" />
              <span className="text-xl font-bold text-[#005EB8]">EduAccess</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Platform pembelajaran online yang dirancang khusus untuk penyandang disabilitas dengan fitur aksesibilitas lengkap.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social, index) => (
                <Link 
                  key={index}
                  href={social.href} 
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-[#005EB8] hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Tentang Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Tentang
            </h3>
            <ul className="space-y-3">
              {footerLinks.tentang.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#005EB8] dark:hover:text-[#005EB8] transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dukungan Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Dukungan
            </h3>
            <ul className="space-y-3">
              {footerLinks.dukungan.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#005EB8] dark:hover:text-[#005EB8] transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Kontak
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-1.5 bg-[#005EB8]/10 rounded-md mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[#005EB8]" />
                </div>
                <span>Jl. Pendidikan No. 123, Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-1.5 bg-[#005EB8]/10 rounded-md">
                  <Phone className="h-3.5 w-3.5 text-[#005EB8]" />
                </div>
                <span>+62 21 1234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-1.5 bg-[#005EB8]/10 rounded-md">
                  <Mail className="h-3.5 w-3.5 text-[#005EB8]" />
                </div>
                <span>info@eduaccess.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} EduAccess. Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
              <Link href="/privacy" className="hover:text-[#005EB8] transition-colors">
                Privasi
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[#005EB8] transition-colors">
                Ketentuan
              </Link>
              <span>•</span>
              <Link href="/accessibility" className="hover:text-[#005EB8] transition-colors">
                Aksesibilitas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
