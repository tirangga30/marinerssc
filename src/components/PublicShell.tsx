'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import { ClubModeProvider } from '@/context/ClubModeContext';

/**
 * Membungkus Navbar, Footer & PageLoader dengan pengecekan path.
 * Halaman /admin/* tidak akan menampilkan Navbar & Footer publik.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <ClubModeProvider>
      <Suspense fallback={null}>
        <PageLoader />
      </Suspense>
      {!isAdminPage && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAdminPage && <Footer />}
    </ClubModeProvider>
  );
}
