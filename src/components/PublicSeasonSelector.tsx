'use client';

import React from 'react';
import Link from 'next/link';
import { setClientPublicSeason } from '@/lib/publicSeason';

interface Season {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
}

interface Props {
  seasons: Season[];
  selectedSeason: string;
  baseUrl: string;
  extraParams?: Record<string, string>;
  showAllOption?: boolean;
}

export default function PublicSeasonSelector({
  seasons,
  selectedSeason,
  baseUrl,
  extraParams = {},
  showAllOption = false,
}: Props) {
  const handleSelect = (seasonName: string) => {
    if (seasonName !== 'all') {
      setClientPublicSeason(seasonName);
    }
  };

  const getUrl = (season: string) => {
    const sp = new URLSearchParams(extraParams);
    sp.set('season', season);
    return `${baseUrl}?${sp.toString()}`;
  };

  return (
    <div className="pt-3 flex items-center justify-center gap-2 flex-wrap">
      {showAllOption && (
        <Link
          href={getUrl('all')}
          onClick={() => handleSelect('all')}
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            selectedSeason === 'all'
              ? 'bg-sky-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Semua Musim
        </Link>
      )}
      {seasons.map((s) => (
        <Link
          key={s.id}
          href={getUrl(s.name)}
          onClick={() => handleSelect(s.name)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            selectedSeason === s.name
              ? 'bg-sky-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Musim {s.name} {s.isCurrent ? '(Aktif)' : ''}
        </Link>
      ))}
    </div>
  );
}
