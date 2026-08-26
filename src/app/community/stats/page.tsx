import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Award, Flame, Shield, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

const formatPosition = (pos: string) => {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos || 'Midfielder';
};

export default async function CommunityStatsPage() {
  const rawMembers = await prisma.member.findMany({
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
    const appearances = Math.max((m.funAppearances || 0) + (m.mainAppearances || 0), calcAppearances);

    const calcYellow = (m.funMatchEvents || []).filter((e: any) => e.type === 'yellow_card').length;
    const yellowCards = Math.max(m.yellowCards || 0, calcYellow);

    const calcRed = (m.funMatchEvents || []).filter((e: any) => e.type === 'red_card').length;
    const redCards = Math.max(m.redCards || 0, calcRed);

    const points = (goals * 5) + (assists * 3) + (appearances * 1) - (yellowCards * 1) - (redCards * 3);

    return {
      ...m,
      name: m.nickname || m.fullName,
      number: m.jerseyNumber,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-sky-400/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Papan Keunggulan Individu</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 blue-gradient-text">
          Statistik Member
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Daftar performa terbaik, pencetak gol terbanyak, penyaji assist ulung, serta pilar penampilan teratur.
        </p>
      </div>

      {/* Performance Table (Full Width) */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-400/30 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-black uppercase text-slate-100">Top Performa</h2>
        </div>

        <div className="space-y-3">
          {performanceMembers.map((member, rank) => (
            <Link
              key={member.id}
              href={`/community/players/${member.id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {rank + 1}
                </span>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                  <img src={member.photoUrl || '/playertemplate.png'} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="text-sky-400 font-mono font-black">{member.number}</span>
                    <span>{member.name}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(member.position)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono blue-gradient-text">{member.points}</span>
                <span className="text-[10px] text-slate-400 block font-bold">POIN</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="pt-2 text-[10px] text-slate-500 text-center">
          *Poin = Gol (5), Assist (3), Tampil (1), Kartu Kuning (-1), Kartu Merah (-3)
        </div>
      </div>

      {/* Grid Tables (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Table 1: Top Scorers */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Top Skorer</h2>
          </div>

          <div className="space-y-3">
            {topScorers.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={member.photoUrl || '/playertemplate.png'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{member.goals}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 2: Top Assists */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Top Assist</h2>
          </div>

          <div className="space-y-3">
            {topAssists.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={member.photoUrl || '/playertemplate.png'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{member.assists}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 3: Appearances */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Top Penampilan</h2>
          </div>

          <div className="space-y-3">
            {topAppearances.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={member.photoUrl || '/playertemplate.png'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{member.appearances}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
