'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  X, 
  Menu,
  Home,
  LayoutGrid,
  Users,
  DollarSign,
  Award,
  Star
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    icon: Home,
    link: '/mentor/dashboard',
    requiresApproval: true,
  },
  {
    label: 'My Courses',
    icon: LayoutGrid,
    link: '/mentor/courses',
    requiresApproval: true,
  },
  {
    label: 'Students',
    icon: Users,
    link: '/mentor/students-enrolled',
    requiresApproval: true,
  },
  {
    label: 'Revenue',
    icon: DollarSign,
    link: '/mentor/revenue',
    requiresApproval: true,
  },
  {
    label: 'Certificates',
    icon: Award,
    link: '/mentor/certificates',
    requiresApproval: true,
  },
  {
    label: 'Reviews',
    icon: Star,
    link: '/mentor/reviews',
    requiresApproval: true,
  }
];

interface SidebarMentorProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  mentorStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

export default function SidebarMentor({ isOpen, toggleSidebar, mentorStatus }: SidebarMentorProps) {
  const pathname = usePathname();
  const isApproved = mentorStatus === 'APPROVED';

  return (
    <>
      {/* Overlay untuk mobile */}
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
          {/* Header Sidebar */}
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

          {/* Menu Items */}
          <nav className={`flex-1 p-4 ${isOpen ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Check for active state - also match nested routes
                const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
                const isDisabled = item.requiresApproval && !isApproved;

                if (isDisabled) {
                  return (
                    <div
                      key={item.link}
                      className={`
                        flex items-center gap-3 px-3 rounded-lg transition-all duration-200 group relative
                        h-11 cursor-not-allowed opacity-50
                        text-gray-400 dark:text-gray-500
                        ${!isOpen && 'justify-center'}
                      `}
                      title={!isOpen ? `${item.label} (Requires approval)` : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isOpen && (
                        <span className="font-medium whitespace-nowrap text-sm flex items-center gap-2">
                          {item.label}
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            Locked
                          </span>
                        </span>
                      )}
                      
                      {/* Tooltip untuk collapsed state */}
                      {!isOpen && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                          {item.label} (Locked)
                        </div>
                      )}
                    </div>
                  );
                }

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
                      // Untuk mobile, tutup sidebar ketika menu diklik
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                    )}
                    
                    {/* Tooltip untuk collapsed state */}
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

          {/* Status Badge at bottom */}
          {isOpen && mentorStatus !== 'APPROVED' && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className={`
                px-3 py-2 rounded-lg text-sm font-medium text-center
                ${mentorStatus === null 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  : mentorStatus === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}
              `}>
                {mentorStatus === null 
                  ? 'Lengkapi Profil & Apply'
                  : mentorStatus === 'PENDING' 
                    ? 'Menunggu Approval' 
                    : 'Ditolak'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}