'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Admin Layout
 * Uses plain dark navy blue background for all admin pages,
 * preserving the stadium photo wallpaper exclusively for /admin/login.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div className="relative min-h-screen">
        {/* Stadium background photo for login */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/newposter.webp')", zIndex: 0 }}
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
      {/* Stadium wallpaper for Admin Panel */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/stadium_hero2.png')", zIndex: 0 }}
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
