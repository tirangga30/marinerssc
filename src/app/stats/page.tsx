import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Trophy, Award, Flame, Shield, ArrowRight } from 'lucide-react';

export const revalidate = 0;

export default async function StatsPage() {
  const topScorers = await prisma.player.findMany({
    orderBy: { goals: 'desc' },
    take: 5,
  });

  const topAssists = await prisma.player.findMany({
    orderBy: { assists: 'desc' },
    take: 5,
  });

  const topAppearances = await prisma.player.findMany({
    orderBy: { appearances: 'desc' },
    take: 5,
  });

  const disciplineRecord = await prisma.player.findMany({
    orderBy: [{ yellowCards: 'desc' }, { redCards: 'desc' }],
    take: 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-amber-500/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Papan Keunggulan Individu</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 gold-gradient-text">
          Statistik Pemain Musim 2026/2027
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Daftar pencetak gol terbanyak, penyaji assist ulung, pilar penampilan teratur, serta catatan kedisiplinan tim.
        </p>
      </div>

      {/* Grid Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Table 1: Top Scorers */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Top Skorer (Gol Terbanyak)</h2>
          </div>

          <div className="space-y-3">
            {topScorers.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/40">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">{player.name}</p>
                    <p className="text-[10px] text-amber-400/80 font-semibold">{player.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono gold-gradient-text">{player.goals}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">GOL</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 2: Top Assists */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Top Assist (Umpan Kunci)</h2>
          </div>

          <div className="space-y-3">
            {topAssists.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/40">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">{player.name}</p>
                    <p className="text-[10px] text-amber-400/80 font-semibold">{player.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-slate-100">{player.assists}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">ASSIST</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 3: Appearances */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Penampilan Terbanyak</h2>
          </div>

          <div className="space-y-3">
            {topAppearances.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full font-mono text-xs font-black bg-slate-800 text-slate-400 flex items-center justify-center">
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/40">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">{player.name}</p>
                    <p className="text-[10px] text-amber-400/80 font-semibold">{player.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-slate-100">{player.appearances}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">LAGA</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 4: Discipline */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Catatan Kartu & Kedisiplinan</h2>
          </div>

          <div className="space-y-3">
            {disciplineRecord.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full font-mono text-xs font-black bg-slate-800 text-slate-400 flex items-center justify-center">
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/40">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">{player.name}</p>
                    <p className="text-[10px] text-amber-400/80 font-semibold">{player.position}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                    🟨 {player.yellowCards}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold font-mono">
                    🟥 {player.redCards}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
