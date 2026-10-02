'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Admin Layout
 * Dynamically uses custom wallpapers configured via Team Management Portal,
 * with robust fallbacks for /admin/login and /admin dashboard panels.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [loginWallpaper, setLoginWallpaper] = useState('/newposter.webp');
  const [adminWallpaper, setAdminWallpaper] = useState('/stadium_hero2.png');

  const fetchWallpapers = () => {
    fetch('/api/admin/system-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.loginWallpaper) setLoginWallpaper(data.loginWallpaper);
          if (data.adminWallpaper) setAdminWallpaper(data.adminWallpaper);
        }
      })
      .catch((err) => console.warn('Failed to fetch admin wallpapers:', err));
  };

  useEffect(() => {
    fetchWallpapers();
    const handleUpdate = () => fetchWallpapers();
    window.addEventListener('system_settings_updated', handleUpdate);
    return () => window.removeEventListener('system_settings_updated', handleUpdate);
  }, []);

  if (isLoginPage) {
    return (
      <div className="relative min-h-screen">
        {/* Stadium/Custom background photo for login */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url('${loginWallpaper}')`, zIndex: 0 }}
          aria-hidden="true"
        />
        <div
          className="fixed inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(3,7,18,0.40) 0%, rgba(3,7,18,0.50) 50%, rgba(3,7,18,0.60) 100%)',
            zIndex: 1,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col min-h-screen" style={{ zIndex: 10 }}>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070e1c] text-slate-100">
      {/* Stadium/Custom wallpaper for Admin Panel */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url('${adminWallpaper}')`, zIndex: 0 }}
        aria-hidden="true"
      />
      {/* Dark overlay for contrast and legibility */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-[#070e1c]/90 via-[#070e1c]/80 to-[#070e1c]/95 pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 10 }}>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
