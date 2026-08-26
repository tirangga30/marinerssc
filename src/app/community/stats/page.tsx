import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Trophy, Award, Flame, Shield, ArrowRight, Activity, Sparkles, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

const formatPosition = (pos: string) => {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos;
};

export default async function CommunityStatsPage() {
  const rawMembers = await prisma.member.findMany({
    where: { status: 'ACTIVE' },
    include: {
      funMatchEvents: true,
      matchAttendances: {
        where: { status: 'CONFIRMED' },
        include: { funMatch: true },
      },
    },
  });

  const allMembers = rawMembers.map((m) => {
    const calcGoals = (m.funMatchEvents || []).filter((e: any) => e.type === 'goal').length;
    const goals = Math.max(m.goals || 0, calcGoals);

    const calcAssists = (m.funMatchEvents || []).filter((e: any) => e.type === 'assist').length;
    const assists = Math.max(m.assists || 0, calcAssists);

    const calcAppearances = (m.matchAttendances || []).filter((a: any) => a.funMatchId !== null).length;
    const appearances = Math.max(m.funAppearances || 0, calcAppearances);

    const calcYellow = (m.funMatchEvents || []).filter((e: any) => e.type === 'yellow_card').length;
    const yellowCards = Math.max(m.yellowCards || 0, calcYellow);

    const calcRed = (m.funMatchEvents || []).filter((e: any) => e.type === 'red_card').length;
    const redCards = Math.max(m.redCards || 0, calcRed);

    const points = (goals * 5) + (assists * 3) + (appearances * 1) - (yellowCards * 1) - (redCards * 3);

    return {
      ...m,
      goals,
      assists,
      appearances,
      yellowCards,
      redCards,
      points,
    };
  });

  const performanceMembers = [...allMembers].sort((a, b) => b.points - a.points).slice(0, 5);
  const topScorers = [...allMembers].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...allMembers].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const topAppearances = [...allMembers].sort((a, b) => b.appearances - a.appearances).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 sm:space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-amber-400/30 text-center space-y-3 bg-gradient-to-b from-[#15120a] via-[#090b14] to-[#060b14] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Statistik Soccer Community</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Statistik Member Musim 2026/2027
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Papan peringkat performa individu member di seluruh pertandingan Fun Match Mariners SC Soccer Community.
        </p>
      </div>

      {/* Performance Table (Full Width) */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-amber-400/30 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm sm:text-lg font-black uppercase text-white">Top 5 Performa Member (MVP Point)</h2>
            <p className="text-[10px] sm:text-xs text-slate-400">Poin dihitung dari Gol (5), Assist (3), Penampilan (1), Kartu Kuning (-1), Kartu Merah (-3)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-2">Rank</th>
                <th className="pb-2">Member</th>
                <th className="pb-2">Posisi</th>
                <th className="pb-2">Tier</th>
                <th className="pb-2 text-center">Main</th>
                <th className="pb-2 text-center">Gol</th>
                <th className="pb-2 text-center">Assist</th>
                <th className="pb-2 text-center">Kartu (K/M)</th>
                <th className="pb-2 text-right">Total Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {performanceMembers.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-mono font-bold text-amber-400">#{idx + 1}</td>
                  <td className="py-3">
                    <Link href={`/community/players/${m.id}`} className="flex items-center gap-2 font-bold text-white hover:text-amber-300">
                      <img src={m.photoUrl || '/playertemplate.png'} alt={m.fullName} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      <span>{m.nickname || m.fullName}</span>
                      <span className="text-[10px] text-amber-400 font-mono">#{m.jerseyNumber}</span>
                    </Link>
                  </td>
                  <td className="py-3 text-slate-400">{formatPosition(m.position)}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                      {m.tier}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono">{m.appearances}</td>
                  <td className="py-3 text-center font-mono font-bold text-sky-300">{m.goals}</td>
                  <td className="py-3 text-center font-mono font-bold text-amber-300">{m.assists}</td>
                  <td className="py-3 text-center font-mono text-slate-400">{m.yellowCards} / {m.redCards}</td>
                  <td className="py-3 text-right font-mono font-black text-amber-400 text-sm">{m.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Grid Stat Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Scorers */}
        <div className="glass-panel p-5 rounded-2xl border border-sky-400/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black uppercase text-white">Top Goalscorers</h3>
          </div>
          <div className="space-y-3">
            {topScorers.map((m, idx) => (
              <Link key={m.id} href={`/community/players/${m.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-sky-400 w-4">#{idx + 1}</span>
                  <img src={m.photoUrl || '/playertemplate.png'} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{m.nickname || m.fullName}</p>
                    <p className="text-[10px] text-slate-400">{m.position} • #{m.jerseyNumber}</p>
                  </div>
                </div>
                <span className="font-mono font-black text-base text-sky-300">{m.goals} Gol</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Assists */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-400/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white">Top Assists</h3>
          </div>
          <div className="space-y-3">
            {topAssists.map((m, idx) => (
              <Link key={m.id} href={`/community/players/${m.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-amber-400 w-4">#{idx + 1}</span>
                  <img src={m.photoUrl || '/playertemplate.png'} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{m.nickname || m.fullName}</p>
                    <p className="text-[10px] text-slate-400">{m.position} • #{m.jerseyNumber}</p>
                  </div>
                </div>
                <span className="font-mono font-black text-base text-amber-300">{m.assists} Ast</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Appearances */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-400/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black uppercase text-white">Laga Terbanyak</h3>
          </div>
          <div className="space-y-3">
            {topAppearances.map((m, idx) => (
              <Link key={m.id} href={`/community/players/${m.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-emerald-400 w-4">#{idx + 1}</span>
                  <img src={m.photoUrl || '/playertemplate.png'} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{m.nickname || m.fullName}</p>
                    <p className="text-[10px] text-slate-400">{m.position} • #{m.jerseyNumber}</p>
                  </div>
                </div>
                <span className="font-mono font-black text-base text-emerald-300">{m.appearances} Laga</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
