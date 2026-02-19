// MentorLayout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import NavbarMentor from './navbar-mentor';
import SidebarMentor from './sidebar-mentor';

// Client-side getCookie function
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mentorStatus, setMentorStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchMentorStatus = useCallback(async () => {
    try {
      // First try to get from localStorage user data
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.mentor_profile?.status) {
          setMentorStatus(user.mentor_profile.status);
          return;
        }
      }

      // Fallback: fetch from API
      let token = localStorage.getItem('accessToken');
      if (!token) {
        token = getCookieValue('accessToken');
      }
      if (!token) return;

      const response = await fetch('/api/mentors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMentorStatus(data.profile?.status || null);
      }
    } catch (error) {
      console.error('Error fetching mentor status:', error);
    }
  }, []);

  useEffect(() => {
    fetchMentorStatus();
  }, [fetchMentorStatus]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavbarMentor toggleSidebar={toggleSidebar} />
      <SidebarMentor 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        mentorStatus={mentorStatus}
      />
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
