import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import MatchTabs from '@/components/MatchTabs';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import MatchAttendanceConfirm from '@/components/MatchAttendanceConfirm';
import { Calendar, MapPin, Trophy, ArrowLeft } from 'lucide-react';

import { formatWibDate, formatWibTime } from '@/lib/date';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';
import MatchShareButton from '@/components/MatchShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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
  let systemSetting: any = null;
  try {
    const [fetchedMatch, fetchedSetting] = await Promise.all([
      prisma.footballMatch.findUnique({
        where: { id },
        include: {
          lineups: {
            include: { player: true },
          },
          events: {
            include: { player: true, assistPlayer: true },
            orderBy: { minute: 'asc' },
          },
          attendances: {
            include: { player: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null),
    ]);
    match = fetchedMatch;
    systemSetting = fetchedSetting;
  } catch (error) {
    console.error('Database error in MatchDetailPage:', error);
  }

  if (!match) {
    notFound();
  }

  const teamName = systemSetting?.teamName || 'TEAM';
  const teamLogo = systemSetting?.teamLogo || '/defaultteam.webp';

  const isFriendly = (match.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY';
  const matchLabel = match.stage || (isFriendly ? 'Friendly Match' : match.competition || 'Pertandingan');
  const status = getDynamicMatchStatus(match);

  // Target season: prioritize searchParams if explicitly passed, otherwise match's seasonName, then cookieSeason
  const targetSeason = sParams?.season || match.seasonName || cookieSeason || '';

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
    attendances: (match.attendances || []).map((att: any) => ({
      ...att,
      player: att.player ? resolvePlayerForSeason(att.player, targetSeason) : att.player,
    })),
  };

  // Query Head-to-Head (H2H) matches against the exact same opponent name
  let h2hMatches: any[] = [];
  try {
    const rawMatches = await prisma.footballMatch.findMany({
      where: {
        id: { not: match.id },
      },
      orderBy: { matchDate: 'desc' },
      select: {
        id: true,
        opponentName: true,
        opponentLogo: true,
        matchDate: true,
        competition: true,
        stage: true,
        seasonName: true,
        venue: true,
        isHome: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });

    const cleanOpponent = (match.opponentName || '').trim().toLowerCase();
    const otherMatches = rawMatches.filter(
      (m) => (m.opponentName || '').trim().toLowerCase() === cleanOpponent
    );

    // If there is match history against this opponent, include this current match
    if (otherMatches.length > 0) {
      const currentMatchItem = {
        id: match.id,
        opponentName: match.opponentName,
        opponentLogo: match.opponentLogo,
        matchDate: match.matchDate,
        competition: match.competition,
        stage: match.stage,
        seasonName: match.seasonName,
        venue: match.venue,
        isHome: match.isHome,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        isCurrent: true,
      };

      h2hMatches = [currentMatchItem, ...otherMatches].sort(
        (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );
    }
  } catch (h2hErr) {
    console.warn('Error fetching H2H matches:', h2hErr);
  }

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
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-slate-500">
              {formatWibDate(match.matchDate, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })} • {formatWibTime(match.matchDate)}
            </span>
            <MatchShareButton match={resolvedMatch} teamName={teamName} />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-4 items-center text-center max-w-4xl mx-auto">

          {/* Home Team (Nama di sisi luar kiri mendekat ke logo di tengah) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 min-w-0">
            <h2 className="text-xs sm:text-base md:text-lg font-black uppercase text-slate-900 text-right truncate flex-1">
              {(match.isHome ? teamName : match.opponentName).toUpperCase()}
            </h2>
            <div className="shrink-0 w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
              <img
                src={match.isHome ? teamLogo : (match.opponentLogo || '/defaultteam.webp')}
                alt={match.isHome ? teamName : match.opponentName}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Center Score / Status (Sejajar dengan Logo & Nama Tim) */}
          <div className="flex flex-col items-center justify-center min-w-[80px] sm:min-w-[130px] px-1 sm:px-3 py-0.5">
            {status === 'live' ? (
              <LiveScoreDisplay
                targetDate={match.matchDate}
                duration={match.duration}
                homeScore={match.homeScore ?? 0}
                awayScore={match.awayScore ?? 0}
                isLiveEnabled={match.isLiveEnabled !== false}
              />
            ) : status === 'finished' ? (
              <>
                <div className="h-5 sm:h-6 flex items-center justify-center shrink-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-600 tracking-wider">
                    FULL TIME
                  </span>
                </div>
                <div className="text-2xl sm:text-5xl md:text-6xl font-black font-mono blue-gradient-text tracking-widest leading-none flex items-center justify-center my-0.5 sm:my-1">
                  {match.homeScore ?? 0} : {match.awayScore ?? 0}
                </div>
                <div className="h-5 sm:h-6 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                  <p className="text-[8px] sm:text-[11px] text-slate-500 font-medium truncate text-center">
                    {match.venue || '—'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-5 sm:h-6 flex items-center justify-center shrink-0">
                  <span className="text-[9px] sm:text-xs text-blue-600 font-bold uppercase">
                    Mendatang
                  </span>
                </div>
                <div className="flex items-center justify-center my-0.5 sm:my-1">
                  <div className="inline-block px-3 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 text-base sm:text-3xl font-black border border-blue-200 leading-none">
                    VS
                  </div>
                </div>
                <div className="h-5 sm:h-6 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                  <p className="text-[8px] sm:text-[11px] text-slate-500 font-medium truncate text-center">
                    {match.venue || '—'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Away Team (Logo di tengah, Nama di sisi luar kanan mendekat ke logo) */}
          <div className="flex items-center justify-start gap-1.5 sm:gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
              <img
                src={!match.isHome ? teamLogo : (match.opponentLogo || '/defaultteam.webp')}
                alt={!match.isHome ? teamName : match.opponentName}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-xs sm:text-base md:text-lg font-black uppercase text-slate-900 text-left truncate flex-1">
              {(!match.isHome ? teamName : match.opponentName).toUpperCase()}
            </h2>
          </div>

        </div>

      </div>

      {/* Match Attendance Confirmation Banner for Players (?p=...) */}
      <React.Suspense fallback={null}>
        <MatchAttendanceConfirm
          matchId={match.id}
          opponentName={match.opponentName}
          matchDate={match.matchDate}
          matchStatus={status}
          matchDateText={`${formatWibDate(match.matchDate, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })} • ${formatWibTime(match.matchDate)}`}
          venueText={match.venue}
          initialAttendances={resolvedMatch.attendances}
        />
      </React.Suspense>

      {/* Match Content Tabs (Summary & Timeline / Lineup & Formasi / H2H) */}
      <React.Suspense fallback={null}>
        <MatchTabs match={resolvedMatch} h2hMatches={h2hMatches} />
      </React.Suspense>

    </div>
  );
}
