'use client';

import React from 'react';
import Link from 'next/link';
import { setClientPublicSeason } from '@/lib/publicSeason';

export interface SeasonItem {
  id: string;
  name: string;
  year?: number;
  isCurrent?: boolean;
}

interface SeasonSubNavProps {
  seasons: SeasonItem[];
  selectedSeason: string;
  basePath: string; // e.g. '/matches', '/players', '/articles', '/stats'
  searchParams?: Record<string, string | string[] | undefined>;
  showAllOption?: boolean; // Khusus /stats ada opsi 'SEMUA MUSIM' di ujung kiri
}

export default function SeasonSubNav({
  seasons = [],
  selectedSeason,
  basePath,
  searchParams = {},
  showAllOption = false,
}: SeasonSubNavProps) {
  // Bangun URL dengan mempertahankan parameter query yang ada selain season
  const buildUrl = (seasonValue: string) => {
    const sp = new URLSearchParams();

    // Salin searchParams yang ada selain season
    Object.entries(searchParams).forEach(([key, val]) => {
      if (key === 'season') return;
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((v) => sp.append(key, v));
      } else {
        sp.set(key, val);
      }
    });

    sp.set('season', seasonValue);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const tabs: Array<{ key: string; label: string; value: string; href: string }> = [];

  // Khusus statistik: tambahkan opsi 'SEMUA MUSIM' di ujung kiri
  if (showAllOption) {
    tabs.push({
      key: 'all',
      label: 'SEMUA MUSIM',
      value: 'all',
      href: buildUrl('all'),
    });
  }

  // Tambahkan musim-musim yang tersedia (misal: 2027, 2026, 2025)
  seasons.forEach((s) => {
    const cleanName = s.name.trim();
    const label = cleanName.toUpperCase().startsWith('MUSIM')
      ? cleanName.toUpperCase()
      : `MUSIM ${cleanName}`;

    tabs.push({
      key: s.id || cleanName,
      label,
      value: cleanName,
      href: buildUrl(cleanName),
    });
  });

  if (tabs.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs sticky top-16 sm:top-20 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = selectedSeason === tab.value;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                onClick={() => {
                  if (tab.value && tab.value !== 'all') {
                    setClientPublicSeason(tab.value);
                  }
                }}
                className={`pb-2.5 sm:pb-3 pt-2.5 sm:pt-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

