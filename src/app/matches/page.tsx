import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, MapPin, Flame, CheckCircle2, Clock } from 'lucide-react';

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
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Jadwal &amp; Hasil Pertandingan</span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white blue-gradient-text">
          Season 2026/2027
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
      <div className="space-y-4 sm:space-y-6">
        {filteredMatches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-sky-300 transition-colors">
                {match.status === 'scheduled' ? 'Laga Mendatang' : 'Hasil Pertandingan'}
              </h3>
              <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                {match.competition || 'Matchday 1'}
              </span>
            </div>

            {/* Main Scoreboard Content */}
            <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
              
              {/* Home Team (Mariners SC or Opponent) */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                <div className="order-2 sm:order-1 text-center sm:text-right">
                  <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                    {match.isHome ? 'MARINERS SC' : match.opponentName}
                  </h4>
                </div>
                <div className="order-1 sm:order-2 flex items-center justify-center">
                  <img
                    src={match.isHome ? '/marinerssc.png' : match.opponentLogo}
                    alt={match.isHome ? 'Mariners SC' : match.opponentName}
                    className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Score / VS Badge */}
              <div className="space-y-0.5 sm:space-y-2">
                {match.status === 'finished' ? (
                  <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                    {match.homeScore} : {match.awayScore}
                  </div>
                ) : (
                  <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                    VS
                  </div>
                )}
                <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                  {new Date(match.matchDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} • {new Date(match.matchDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">
                  {match.venue} ({match.isHome ? 'Kandang' : 'Tandang'})
                </p>
              </div>

              {/* Away Team */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                <div className="flex items-center justify-center">
                  <img
                    src={!match.isHome ? '/marinerssc.png' : match.opponentLogo}
                    alt={!match.isHome ? 'Mariners SC' : match.opponentName}
                    className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                    {!match.isHome ? 'MARINERS SC' : match.opponentName}
                  </h4>
                </div>
              </div>

            </div>

          </Link>
        ))}
      </div>

    </div>
  );
}
