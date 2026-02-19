// UserLayout.tsx
'use client';

import { useState } from 'react';
import NavbarUser from './navbar-user';
import SidebarUser from './sidebar-user';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavbarUser toggleSidebar={toggleSidebar} />
      <SidebarUser isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}
      `}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}