'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import { ClubModeProvider } from '@/context/ClubModeContext';
import { SystemSettingProvider, SystemSettingData } from '@/context/SystemSettingContext';

/**
 * Membungkus Navbar, Footer & PageLoader dengan pengecekan path.
 * Halaman /admin/* tidak akan menampilkan Navbar & Footer publik dan tidak menggunakan wallpaper publik.
 */
export default function PublicShell({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SystemSettingData>;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <SystemSettingProvider initialSettings={initialSettings}>
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
