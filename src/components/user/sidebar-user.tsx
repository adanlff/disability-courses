'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  X, 
  Menu,
  Home,
  LayoutGrid,
  BookOpen,
  Heart,
  CreditCard,
  FileCheck,
  Star
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    icon: Home,
    link: '/user/dashboard',
  },
  {
    label: 'Courses',
    icon: LayoutGrid,
    link: '/user/courses',
  },
  {
    label: 'Enrollments',
    icon: BookOpen,
    link: '/user/enrollments',
  },
  {
    label: 'Wishlist',
    icon: Heart,
    link: '/user/wishlist',
  },
  {
    label: 'Transactions',
    icon: CreditCard,
    link: '/user/transaction',
  },
  {
    label: 'Certificates',
    icon: FileCheck,
    link: '/user/certificates',
  },
  {
    label: 'Reviews',
    icon: Star,
    link: '/user/reviews',
  }
];

interface SidebarUserProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function SidebarUser({ isOpen, toggleSidebar }: SidebarUserProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        transition-all duration-300 ease-in-out z-50
        ${isOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700 h-16">
            {isOpen ? (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>

          <nav className={`flex-1 p-4 ${isOpen ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);

                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={`
                      flex items-center gap-3 px-3 rounded-lg transition-all duration-200 group relative
                      h-11
                      ${isActive
                        ? 'bg-[#005EB8] text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                    title={!isOpen ? item.label : ''}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                    )}
                    
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}