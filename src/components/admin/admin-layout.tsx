// AdminLayout.tsx
'use client';

import { useState } from 'react';
import NavbarAdmin from './navbar-admin';
import SidebarAdmin from './sidebar-admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavbarAdmin toggleSidebar={toggleSidebar} />
      <SidebarAdmin isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
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