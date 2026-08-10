import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, Shield, MapPin, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'all';

  const matches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'desc' },
  });

  const filteredMatches = matches.filter((m) => {
    if (filter === 'upcoming') return m.status === 'scheduled';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-amber-500/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Jadwal & Hasil Pertandingan</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 gold-gradient-text">
          BRI Liga 1 2025/2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Pantau seluruh hasil laga dan jadwal mendatang klub sepak bola Mariners FC.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2">
        <Link
          href="/matches?filter=all"
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-400'
          }`}
        >
          Semua Laga ({matches.length})
        </Link>
        <Link
          href="/matches?filter=upcoming"
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'upcoming'
              ? 'gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-400'
          }`}
        >
          Mendatang ({matches.filter((m) => m.status === 'scheduled').length})
        </Link>
        <Link
          href="/matches?filter=finished"
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'finished'
              ? 'gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-400'
          }`}
        >
          Selesai ({matches.filter((m) => m.status === 'finished').length})
        </Link>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="group glass-panel p-6 rounded-2xl border border-slate-800 card-glow-hover flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* Date & Competition */}
            <div className="flex flex-col items-center md:items-start space-y-1 text-center md:text-left shrink-0 min-w-[160px]">
              <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(match.matchDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-xs text-slate-400 font-medium">{match.competition}</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {match.isHome ? 'Kandang' : 'Tandang'}
              </span>
            </div>

            {/* Scoreboard Middle */}
            <div className="flex-1 grid grid-cols-3 items-center text-center gap-4 max-w-xl">
              
              {/* Home Team (Mariners or Opponent) */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
                  {match.isHome ? (
                    <Shield className="w-8 h-8 text-amber-400" />
                  ) : (
                    <img src={match.opponentLogo} alt={match.opponentName} className="w-full h-full object-contain" />
                  )}
                </div>
                <span className="text-xs font-extrabold uppercase text-slate-100 truncate w-full">
                  {match.isHome ? 'MARINERS FC' : match.opponentName}
                </span>
              </div>

              {/* Score / Status */}
              <div className="space-y-1">
                {match.status === 'finished' ? (
                  <div className="text-2xl sm:text-3xl font-black font-mono gold-gradient-text tracking-widest">
                    {match.homeScore} : {match.awayScore}
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-black">
                    VS
                  </div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {match.status === 'finished' ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Mendatang
                    </span>
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
                  {!match.isHome ? (
                    <Shield className="w-8 h-8 text-amber-400" />
                  ) : (
                    <img src={match.opponentLogo} alt={match.opponentName} className="w-full h-full object-contain" />
                  )}
                </div>
                <span className="text-xs font-extrabold uppercase text-slate-100 truncate w-full">
                  {!match.isHome ? 'MARINERS FC' : match.opponentName}
                </span>
              </div>

            </div>

            {/* CTA Arrow */}
            <div className="shrink-0">
              <span className="px-4 py-2 rounded-xl bg-slate-800/80 text-amber-400 text-xs font-bold uppercase flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                Detail Laga <ArrowRight className="w-4 h-4" />
              </span>
            </div>

          </Link>
        ))}
      </div>

    </div>
  );
}
