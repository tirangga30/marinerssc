import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import MatchTabs from '@/components/MatchTabs';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { Calendar, MapPin, Trophy, ArrowLeft } from 'lucide-react';

import { formatWibDate, formatWibTime } from '@/lib/date';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';

export const dynamic = 'force-dynamic';

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const cookieSeason = cookieStore.get('public_season')?.value;

  let match: any = null;
  try {
    match = await prisma.footballMatch.findUnique({
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
  } catch (error) {
    console.error('Database error in MatchDetailPage:', error);
  }

  if (!match) {
    notFound();
  }

  const isFriendly = (match.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY';
  const matchLabel = match.stage || (isFriendly ? 'Friendly Match' : match.competition || 'Pertandingan');
  const status = getDynamicMatchStatus(match);

  // Target season: prioritize searchParams if explicitly passed, otherwise match's seasonName, then cookieSeason, fallback '2026'
  const targetSeason = sParams?.season || match.seasonName || cookieSeason || '2026';

  const resolvedMatch = {
    ...match,
    seasonName: targetSeason,
    lineups: match.lineups.map((l: any) => ({
      ...l,
      player: resolvePlayerForSeason(l.player, targetSeason),
    })),
    events: match.events.map((e: any) => ({
      ...e,
      player: e.player ? resolvePlayerForSeason(e.player, targetSeason) : e.player,
      assistPlayer: e.assistPlayer ? resolvePlayerForSeason(e.assistPlayer, targetSeason) : e.assistPlayer,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">

      {/* Main Score Board Header - NO BOX AROUND LOGOS */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[10px] sm:text-xs font-bold uppercase">
          {status === 'live' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
            </span>
          ) : (
            <span className="text-blue-600 font-bold">
              {matchLabel}
            </span>
          )}
          <span className="text-slate-500">
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
                src={match.isHome ? '/marinerssc.webp' : (match.opponentLogo || '/defaultteam.webp')}
                alt={match.isHome ? 'Mariners SC' : match.opponentName}
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-xs sm:text-xl font-black text-slate-900 uppercase">
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
                <span className="inline-block mb-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase border border-emerald-200">
                  Full Time
                </span>
                <div className="text-3xl sm:text-6xl font-black font-mono blue-gradient-text tracking-widest">
                  {match.homeScore ?? 0} : {match.awayScore ?? 0}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] sm:text-xs text-blue-600 font-bold uppercase mb-1.5">Mendatang</p>
                <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-blue-50 text-blue-600 text-xl sm:text-3xl font-black border border-blue-200">
                  VS
                </div>
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
              {match.venue}
            </p>
          </div>

          {/* Away Team - NO BOX */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center">
              <img
                src={!match.isHome ? '/marinerssc.webp' : (match.opponentLogo || '/defaultteam.webp')}
                alt={!match.isHome ? 'Mariners SC' : match.opponentName}
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-xs sm:text-xl font-black text-slate-900 uppercase">
              {!match.isHome ? 'MARINERS SC' : match.opponentName}
            </h2>
          </div>

        </div>

      </div>

      {/* Match Content Tabs (Summary & Timeline / Lineup & Formasi) */}
      <MatchTabs match={resolvedMatch} />

    </div>
  );
}
