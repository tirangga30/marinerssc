'use client';

import React from 'react';
import { useSystemSetting } from '@/context/SystemSettingContext';

export default function Loading() {
  const { teamName, teamLogo } = useSystemSetting();

  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-md"
    >
      {/* Glow Backdrop */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Central Logo & Orbit Spinners */}
      <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-6">
        {/* Outer glowing spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-sky-500 animate-spin" />
        
        {/* Middle counter-spinning ring */}
        <div className="absolute inset-2 rounded-full border border-blue-400/30 border-b-blue-600 animate-spin-reverse" />

        {/* Pulsing club logo */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <img
            src={teamLogo || "/marinerssc.webp"}
            alt={teamName || "Mariners SC"}
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(37,99,235,0.3)] animate-pulse"
          />
        </div>
      </div>

      {/* Club Branding & Loading Text */}
      <div className="text-center space-y-2 z-10">
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] blue-gradient-text">
          {teamName || "Mariners SC"}
        </h2>
        
        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-blue-600 animate-pulse flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
          Memuat Halaman...
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-36 sm:w-44 h-1 rounded-full bg-slate-200 overflow-hidden relative mx-auto mt-3 border border-slate-300">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
