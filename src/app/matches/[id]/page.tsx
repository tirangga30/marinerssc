import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatchTabs from '@/components/MatchTabs';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { Calendar, MapPin, Trophy, ArrowLeft } from 'lucide-react';

import { formatWibDate, formatWibTime } from '@/lib/date';

export const revalidate = 0;

function getDynamicMatchStatus(m: any): 'scheduled' | 'live' | 'finished' {
  if (!m) return 'scheduled';
  if (m.status === 'finished') return 'finished';
  const hasFulltime = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
  if (hasFulltime) return 'finished';

  const now = new Date();
  const start = new Date(m.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  if (m.isLiveEnabled !== false) {
    if (now >= start) return 'live';
    return 'scheduled';
  } else {
    const durationMinutes = m.duration || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    if (now < start) return 'scheduled';
    if (now >= start && now <= end) return 'live';
    return 'finished';
  }
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const match = await prisma.footballMatch.findUnique({
    where: { id },
    include: {
      lineups: {
        include: { player: true },
      },
      events: {
        include: { player: true, assistPlayer: true },
        orderBy: { minute: 'asc' },
      },
    },
  });

  if (!match) {
    notFound();
  }

  const allMatches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'asc' },
    select: { id: true },
  });

  const matchdayIndex = allMatches.findIndex((m) => m.id === id) + 1;
  const matchdayLabel = matchdayIndex > 0 ? `Matchday ${matchdayIndex}` : match.competition;
  const status = getDynamicMatchStatus(match);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">

      {/* Main Score Board Header - NO BOX AROUND LOGOS */}
      <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-sky-400/30 text-center space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[10px] sm:text-xs font-bold uppercase">
          {status === 'live' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
            </span>
          ) : (
            <span className="text-sky-400">
              {matchdayLabel}
            </span>
          )}
          <span className="text-slate-400">
            {formatWibDate(match.matchDate, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} • {formatWibTime(match.matchDate)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-center">

          {/* Home Team - NO BOX */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center">
              <img
                src={match.isHome ? '/marinerssc.png' : (match.opponentLogo || '/defaultteam.png')}
                alt={match.isHome ? 'Mariners SC' : match.opponentName}
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
              />
            </div>
            <h2 className="text-xs sm:text-xl font-black text-white uppercase">
              {match.isHome ? 'MARINERS SC' : match.opponentName}
            </h2>
          </div>

          {/* Score Box */}
          <div className="-mt-2 space-y-1">
            {status === 'live' ? (
              <LiveScoreDisplay
                targetDate={match.matchDate}
                duration={match.duration}
                homeScore={match.homeScore ?? 0}
                awayScore={match.awayScore ?? 0}
                isLiveEnabled={match.isLiveEnabled !== false}
              />
            ) : status === 'finished' ? (
              <div>
                <span className="inline-block mb-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase border border-emerald-500/30">
                  Full Time
                </span>
                <div className="text-3xl sm:text-6xl font-black font-mono blue-gradient-text tracking-widest">
                  {match.homeScore ?? 0} : {match.awayScore ?? 0}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] sm:text-xs text-sky-400 font-bold uppercase mb-1.5">Mendatang</p>
                <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-blue-600/30 text-sky-300 text-xl sm:text-3xl font-black border border-sky-400/40">
                  VS
                </div>
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1">
              {match.venue}
            </p>
          </div>

          {/* Away Team - NO BOX */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center">
              <img
                src={!match.isHome ? '/marinerssc.png' : (match.opponentLogo || '/defaultteam.png')}
                alt={!match.isHome ? 'Mariners SC' : match.opponentName}
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
              />
            </div>
            <h2 className="text-xs sm:text-xl font-black text-white uppercase">
              {!match.isHome ? 'MARINERS SC' : match.opponentName}
            </h2>
          </div>

        </div>

      </div>

      {/* Match Content Tabs (Summary & Timeline / Lineup & Formasi) */}
      <MatchTabs match={match} />

    </div>
  );
}
