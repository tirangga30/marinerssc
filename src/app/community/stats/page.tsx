import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Award, Flame, Shield, Activity } from 'lucide-react';

export const revalidate = 60;

const formatPosition = (pos: string) => {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos || 'Midfielder';
};

export default async function CommunityStatsPage() {
  let rawMembers: any[] = [];
  try {
    rawMembers = await prisma.member.findMany({
      select: {
        id: true,
        fullName: true,
        nickname: true,
        jerseyNumber: true,
        position: true,
        photoUrl: true,
        goals: true,
        assists: true,
        funAppearances: true,
        mainAppearances: true,
        yellowCards: true,
        redCards: true,
        funMatchEvents: {
          select: { type: true },
        },
        matchAttendances: {
          where: { status: 'CONFIRMED' },
          select: { funMatchId: true },
        },
      },
    });
  } catch (error) {
    console.warn('Database unreachable in CommunityStatsPage, fallback to empty array:', error);
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      

      {/* Performance Table (Full Width) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Activity className="w-5 h-5 text-amber-500" />
          <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Performa</h2>
        </div>

        <div className="space-y-2.5">
          {performanceMembers.map((member, rank) => (
            <Link
              key={member.id}
              href={`/community/players/${member.id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                  {rank + 1}
                </span>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-200 shrink-0 bg-slate-100">
                  <img src={member.photoUrl || '/playertemplate.webp'} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-amber-600 font-mono font-black">{member.number}</span>
                    <span>{member.name}</span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(member.position)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black font-mono text-amber-600">{member.points}</span>
                <span className="text-[10px] text-slate-500 block font-bold">POIN</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="pt-2 text-[10px] text-slate-500 text-center">
          *Poin = Gol (5), Assist (3), Tampil (1), Kartu Kuning (-1), Kartu Merah (-3)
        </div>
      </div>

      {/* Grid Tables (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Table 1: Top Scorers */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Skorer</h2>
          </div>

          <div className="space-y-2.5">
            {topScorers.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-200 shrink-0 bg-slate-100">
                    <img src={member.photoUrl || '/playertemplate.webp'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-amber-600 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-mono text-amber-600">{member.goals}</span>
                  <span className="text-[10px] text-slate-500 block font-bold">GOL</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 2: Top Assists */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Assist</h2>
          </div>

          <div className="space-y-2.5">
            {topAssists.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-200 shrink-0 bg-slate-100">
                    <img src={member.photoUrl || '/playertemplate.webp'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-amber-600 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-mono text-amber-600">{member.assists}</span>
                  <span className="text-[10px] text-slate-500 block font-bold">ASSIST</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table 3: Appearances */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Penampilan</h2>
          </div>

          <div className="space-y-2.5">
            {topAppearances.map((member, rank) => (
              <Link
                key={member.id}
                href={`/community/players/${member.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-200 shrink-0 bg-slate-100">
                    <img src={member.photoUrl || '/playertemplate.webp'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-amber-600 font-mono font-black">{member.number}</span>
                      <span>{member.name}</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(member.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-mono text-amber-600">{member.appearances}</span>
                  <span className="text-[10px] text-slate-500 block font-bold">MAIN</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
