'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoader() {
  const [navigating, setNavigating] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Instant dismiss initial splash as soon as React hydrates
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // When pathname or searchParams change, show quick top progress bar then complete
  useEffect(() => {
    if (initialLoad) return;

    setNavigating(true);
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <>
      {/* ── TOP ULTRA-FAST SLICK PROGRESS BAR (Like YouTube / GitHub) ── */}
      {navigating && (
        <div className="fixed top-0 left-0 right-0 z-9999 h-1 pointer-events-none overflow-hidden bg-slate-900/50">
          <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.9)] animate-shimmer" />
        </div>
      )}

      {/* ── INITIAL FAST SPLASH (Only on first cold reload, disappears in <150ms) ── */}
      {initialLoad && (
        <div
          className="fixed inset-0 z-9998 flex flex-col items-center justify-center bg-[#060b14] transition-opacity duration-200 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(14, 30, 64, 0.95) 0%, #060b14 75%)',
          }}
        >
          <div className="relative flex items-center justify-center w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-blue-500 animate-spin" />
            <img
              src="/marinerssc.png"
              alt="Mariners SC"
              className="w-14 h-14 object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]"
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400 blue-gradient-text animate-pulse">
            Mariners SC
          </p>
        </div>
      )}
    </>
  );
}
