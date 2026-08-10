import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, MapPin, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl border border-sky-400/20 text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Jadwal & Hasil Pertandingan</span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white blue-gradient-text">
          BRI Liga 1 2025/2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Pantau seluruh hasil laga dan jadwal mendatang klub sepak bola Mariners SC.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-1.5 sm:gap-2">
        <Link
          href="/matches?filter=all"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'white-blue-btn'
              : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Semua ({matches.length})
        </Link>
        <Link
          href="/matches?filter=upcoming"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'upcoming'
              ? 'white-blue-btn'
              : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Mendatang ({matches.filter((m) => m.status === 'scheduled').length})
        </Link>
        <Link
          href="/matches?filter=finished"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'finished'
              ? 'white-blue-btn'
              : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Selesai ({matches.filter((m) => m.status === 'finished').length})
        </Link>
      </div>

      {/* Matches List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredMatches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="group glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 card-glow-hover flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6"
          >
            {/* Date & Competition */}
            <div className="flex flex-col items-center md:items-start space-y-0.5 text-center md:text-left shrink-0 min-w-[140px]">
              <span className="text-xs font-bold text-sky-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(match.matchDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">{match.competition}</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {match.isHome ? 'Kandang' : 'Tandang'}
              </span>
            </div>

            {/* Scoreboard Middle - NO BOX AROUND LOGOS */}
            <div className="flex-1 grid grid-cols-3 items-center text-center gap-2 sm:gap-4 max-w-xl w-full">
              
              {/* Home Team (Mariners SC or Opponent) - NO BOX */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center justify-center">
                  <img
                    src={match.isHome ? '/marinerssc.png' : match.opponentLogo}
                    alt={match.isHome ? 'Mariners SC' : match.opponentName}
                    className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold uppercase text-white truncate w-full">
                  {match.isHome ? 'MARINERS SC' : match.opponentName}
                </span>
              </div>

              {/* Score / Status */}
              <div className="space-y-1">
                {match.status === 'finished' ? (
                  <div className="text-xl sm:text-3xl font-black font-mono blue-gradient-text tracking-widest">
                    {match.homeScore} : {match.awayScore}
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 rounded-xl bg-blue-600/30 text-sky-300 text-xs sm:text-sm font-black border border-sky-400/40">
                    VS
                  </div>
                )}
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {match.status === 'finished' ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : (
                    <span className="text-sky-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Mendatang
                    </span>
                  )}
                </div>
              </div>

              {/* Away Team - NO BOX */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center justify-center">
                  <img
                    src={!match.isHome ? '/marinerssc.png' : match.opponentLogo}
                    alt={!match.isHome ? 'Mariners SC' : match.opponentName}
                    className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold uppercase text-white truncate w-full">
                  {!match.isHome ? 'MARINERS SC' : match.opponentName}
                </span>
              </div>

            </div>

            {/* CTA Arrow */}
            <div className="shrink-0">
              <span className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 text-sky-400 text-xs font-bold uppercase flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Detail Laga <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

          </Link>
        ))}
      </div>

    </div>
  );
}
