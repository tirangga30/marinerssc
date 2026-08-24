'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial load effect: shows loading screen briefly and fades out
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Route change effect: short smooth transition
  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, mounted]);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#060b14] transition-opacity duration-500 pointer-events-auto"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(14, 30, 64, 0.9) 0%, #060b14 75%)',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Glow Backdrop */}
      <div className="absolute w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Central Logo & Orbit Spinners */}
      <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-6">
        
        {/* Outer glowing spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-blue-500 animate-spin" />
        
        {/* Middle counter-spinning ring */}
        <div className="absolute inset-2 rounded-full border border-sky-400/20 border-b-sky-300 animate-spin-reverse" />

        {/* Pulsing club logo */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <img
            src="/marinerssc.png"
            alt="Mariners SC"
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse"
          />
        </div>
      </div>

      {/* Club Branding & Loading Text */}
      <div className="text-center space-y-2 z-10">
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white blue-gradient-text">
          Mariners SC
        </h2>
        
        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-sky-400/90 animate-pulse flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          Memuat Data...
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-36 sm:w-44 h-1 rounded-full bg-slate-800/80 overflow-hidden relative mx-auto mt-3 border border-slate-700/50">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
