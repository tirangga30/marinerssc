'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Check, Plus, Calendar, Users, Layers } from 'lucide-react';
import { setClientAdminSeason } from '@/lib/adminSeason';

interface SeasonData {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  _count?: {
    matches: number;
    players: number;
    competitions: number;
  };
}

interface Props {
  seasons: SeasonData[];
  selectedSeason: string;
}

export default function DashboardSeasonSelector({ seasons, selectedSeason }: Props) {
  const router = useRouter();

  const handleSelectSeason = (seasonName: string) => {
    setClientAdminSeason(seasonName);
    router.push(`/admin/dashboard?season=${encodeURIComponent(seasonName)}`);
    router.refresh();
  };

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-sky-400/40 shadow-xl space-y-4 bg-sky-950/20 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Trophy className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
              Pilih Musim Aktif Panel Admin
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Musim yang dipilih di sini akan menentukan data pertandingan, skuad pemain, dan statistik di seluruh halaman admin.
          </p>
        </div>

        <Link
          href="/admin/seasons"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-slate-700 text-xs font-bold uppercase transition-all cursor-pointer shadow"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Musim Baru
        </Link>
      </div>

      {/* Season Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
        {seasons.map((s) => {
          const isSelected = s.name === selectedSeason;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSeason(s.name)}
              className={`p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 border ${
                isSelected
                  ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10 ring-2 ring-sky-400/30'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                    Musim {s.name}
                  </span>
                  {s.isCurrent && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      Aktif Utama
                    </span>
                  )}
                </div>

                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold">Pilih</span>
                )}
              </div>

              {/* Counts Breakdown */}
              <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-sky-400" />
                  <b>{s._count?.players ?? 0}</b> Skuad
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <b>{s._count?.matches ?? 0}</b> Laga
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <b>{s._count?.competitions ?? 0}</b> Komp.
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
