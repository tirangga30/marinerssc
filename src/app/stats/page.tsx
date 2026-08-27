import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Trophy, Award, Flame, Shield, ArrowRight, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

const formatPosition = (pos: string) => {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos;
};

export default async function StatsPage() {
  const rawPlayers = await prisma.player.findMany({
    where: { isGuest: false, member: null },
    include: {
      events: true,
      assistedEvents: true,
      lineups: { include: { match: true } },
    },
  });

  const nowMs = new Date().getTime();

  const allPlayers = rawPlayers.map((p) => {
    const activeLineups = (p.lineups || []).filter((l: any) => {
      if (!l.match) return false;
      const m = l.match;
      if (m.status === 'finished') return true;
      const hasFT = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
      if (hasFT) return true;
      const matchStartMs = new Date(m.matchDate).getTime();
      return !isNaN(matchStartMs) && nowMs >= matchStartMs;
    });

    const calcGoals = (p.events || []).filter((e: any) => e.type === 'goal' || e.type === 'penalty').length;
    const goals = Math.max(p.goals || 0, calcGoals);

    const calcAssists =
      (p.events || []).filter((e: any) => e.type === 'assist').length +
      (p.assistedEvents || []).filter((e: any) => e.type !== 'sub').length;
    const assists = Math.max(p.assists || 0, calcAssists);

    const calcAppearances = activeLineups.filter((l: any) => {
      if (l.isStarter) return true;
      const m = l.match;
      const matchEvents = m?.events || [];
      return matchEvents.some((e: any) => e.type === 'sub' && e.playerId === p.id);
    }).length;
    const appearances = Math.max(p.appearances || 0, calcAppearances);

    const calcYellow = (p.events || []).filter((e: any) => e.type === 'yellow_card').length;
    const yellowCards = Math.max(p.yellowCards || 0, calcYellow);

    const calcRed = (p.events || []).filter((e: any) => e.type === 'red_card' || e.type === 'second_yellow').length;
    const redCards = Math.max(p.redCards || 0, calcRed);

    return {
      ...p,
      goals,
      assists,
      appearances,
      yellowCards,
      redCards,
    };
  });

  // Calculate points for Performance Table
  // Points system: Goal(5), Assist(3), Appearance(1), YellowCard(-1), RedCard(-3)
  const performancePlayers = allPlayers.map(player => {
    const points = (player.goals * 5) + (player.assists * 3) + (player.appearances * 1) - (player.yellowCards * 1) - (player.redCards * 3);
    return { ...player, points };
  }).sort((a, b) => b.points - a.points).slice(0, 5);

  const topScorers = [...allPlayers].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...allPlayers].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const topAppearances = [...allPlayers].sort((a, b) => b.appearances - a.appearances).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-sky-400/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Papan Keunggulan Individu</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 blue-gradient-text">
          Statistik Pemain Musim 2026/2027
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
          {performancePlayers.map((player, rank) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {rank + 1}
                </span>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="text-sky-400 font-mono font-black">{player.number}</span>
                    <span>{player.name}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(player.position)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono blue-gradient-text">{player.points}</span>
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
            {topScorers.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{player.number}</span>
                      <span>{player.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(player.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{player.goals}</span>
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
            {topAssists.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{player.number}</span>
                      <span>{player.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(player.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{player.assists}</span>
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
            {topAppearances.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center ${rank === 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {rank + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/40 shrink-0">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-sky-400 font-mono font-black">{player.number}</span>
                      <span>{player.name}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formatPosition(player.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-slate-100">{player.appearances}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
