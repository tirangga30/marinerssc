'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import { ClubModeProvider } from '@/context/ClubModeContext';
import { SystemSettingProvider } from '@/context/SystemSettingContext';

/**
 * Membungkus Navbar, Footer & PageLoader dengan pengecekan path.
 * Halaman /admin/* tidak akan menampilkan Navbar & Footer publik dan tidak menggunakan wallpaper publik.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <SystemSettingProvider>
      <ClubModeProvider>
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <div
          className={
            !isAdminPage
              ? "min-h-screen flex flex-col cycling-main-bg"
              : "min-h-screen flex flex-col"
          }
        >
          {!isAdminPage && <Navbar />}
          <main className="flex-1">{children}</main>
          {!isAdminPage && <Footer />}
        </div>
      </ClubModeProvider>
    </SystemSettingProvider>
  );
}
