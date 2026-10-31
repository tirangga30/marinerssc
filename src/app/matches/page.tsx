import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { Trophy, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getCachedMatchesData = unstable_cache(
  async () => {
    try {
      const [seasons, allMatchesRaw, systemSetting] = await Promise.all([
        prisma.season.findMany({
          orderBy: { year: 'desc' },
          select: { id: true, name: true, year: true, isCurrent: true },
        }),
        prisma.footballMatch.findMany({
          include: { events: true },
          orderBy: { matchDate: 'asc' },
        }),
        (prisma as any).systemSetting.findUnique({
          where: { id: 'default' },
        }).catch(() => null),
      ]);
      return { seasons, allMatchesRaw, systemSetting };
    } catch (e) {
      console.warn('Database unreachable in getCachedMatchesData, fallback to empty arrays:', e);
      return { seasons: [], allMatchesRaw: [], systemSetting: null };
    }
  },
  ['mariners-matches-page-cache'],
  { revalidate: 3600, tags: ['matches', 'seasons'] }
);

function getDynamicMatchStatus(m: any): 'scheduled' | 'live' | 'finished' | 'score_pending' {
  if (!m) return 'scheduled';

  const hasScore = m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined;
  const hasFulltime = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
  const isExplicitlyFinished = m.status === 'finished' || hasFulltime;

  const now = new Date();
  const start = new Date(m.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  let isTimeFinished = false;
  if (m.isLiveEnabled !== false) {
    isTimeFinished = isExplicitlyFinished;
  } else {
    const durationMinutes = m.duration || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    isTimeFinished = isExplicitlyFinished || now >= end;
  }

  if (isTimeFinished) {
    if (!hasScore) return 'score_pending';
    return 'finished';
  }

  if (now >= start) return 'live';
  return 'scheduled';
}

function MatchCard({
  match,
  teamName = 'TEAM',
  teamLogo = '/defaultteam.webp',
}: {
  match: any;
  teamName?: string;
  teamLogo?: string;
}) {
  const status = getDynamicMatchStatus(match);
  const our = match.isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
  const their = match.isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
  const result = status === 'finished' && match.homeScore !== null && match.awayScore !== null
    ? (our > their ? 'WIN' : our < their ? 'LOSE' : 'DRAW')
    : null;
  const resultColor = result === 'WIN' ? '#16a34a' : result === 'LOSE' ? '#dc2626' : '#d97706';
  const resultBg   = result === 'WIN' ? 'rgba(22,163,74,0.15)' : result === 'LOSE' ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)';
  const isFriendly = (match.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY';
  const displayStage = match.stage || (isFriendly ? 'Friendly Match' : match.competition);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block group bg-white p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-4 mb-3 sm:mb-6">
        {status === 'live' ? (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
          </span>
        ) : result ? (
          <span
            className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border"
            style={{ color: resultColor, background: resultBg, borderColor: `${resultColor}40` }}
          >
            {result}
          </span>
        ) : (
          <div />
        )}
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-xs font-medium text-slate-500">
            {formatWibDate(match.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {status === 'finished' && (
            <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              FULL TIME
            </span>
          )}
          {displayStage && (
            <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {displayStage}
            </span>
          )}
        </span>
      </div>

      {/* Main Scoreboard Content */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-6 items-center text-center">
        {/* Home Team (Nama di sisi luar, Logo mendekat ke tengah) */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3.5 min-w-0">
          <div className="text-right min-w-0 flex-1">
            <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {(match.isHome ? teamName : match.opponentName).toUpperCase()}
            </h4>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={match.isHome ? teamLogo : (match.opponentLogo || '/defaultteam.webp')}
              alt={match.isHome ? teamName : match.opponentName}
              className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Score / VS Badge (Sejajar dengan Logo & Nama) */}
        <div className="flex flex-col items-center justify-center min-w-0 px-1 py-0.5">
          {status === 'live' ? (
            <LiveScoreDisplay
              targetDate={match.matchDate}
              duration={match.duration}
              homeScore={match.homeScore ?? 0}
              awayScore={match.awayScore ?? 0}
              isLiveEnabled={match.isLiveEnabled !== false}
              events={match.events}
              status={status}
            />
          ) : status === 'score_pending' ? (
            <>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                <span className="text-[9px] sm:text-[11px] font-bold uppercase text-slate-500">
                  FULL TIME
                </span>
              </div>
              <div className="flex items-center justify-center my-0.5 sm:my-1">
                <div className="inline-block px-3 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200 leading-none">
                  VS
                </div>
              </div>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                  {match.venue || '—'}
                </p>
              </div>
            </>
          ) : status === 'finished' ? (
            <>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                <span className="text-[9px] sm:text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                  FULL TIME
                </span>
              </div>
              <div className="text-2xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest leading-none flex items-center justify-center my-0.5 sm:my-1">
                {match.homeScore ?? 0} : {match.awayScore ?? 0}
              </div>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                  {match.venue || '—'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                <span className="text-[9px] sm:text-[11px] text-slate-600 font-bold">
                  {formatWibTime(match.matchDate)}
                </span>
              </div>
              <div className="flex items-center justify-center my-0.5 sm:my-1">
                <div className="inline-block px-3 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200 leading-none">
                  VS
                </div>
              </div>
              <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                  {match.venue || '—'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Away Team (Logo mendekat ke tengah, Nama di sisi luar) */}
        <div className="flex items-center justify-start gap-1.5 sm:gap-3.5 min-w-0">
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={!match.isHome ? teamLogo : (match.opponentLogo || '/defaultteam.webp')}
              alt={!match.isHome ? teamName : match.opponentName}
              className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="text-left min-w-0 flex-1">
            <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {(!match.isHome ? teamName : match.opponentName).toUpperCase()}
            </h4>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MatchListGroupedByCompetition({
  matches,
  teamName,
  teamLogo,
}: {
  matches: any[];
  teamName?: string;
  teamLogo?: string;
}) {
  if (matches.length === 0) {
    return <p className="text-center text-slate-500 text-xs py-8">Tidak ada pertandingan.</p>;
  }

  return (
    <div className="space-y-3">
      {matches.map((m, idx) => {
        const prevMatch = idx > 0 ? matches[idx - 1] : null;
        const currentComp = (m.competition || 'FRIENDLY').toUpperCase();
        const prevComp = prevMatch ? (prevMatch.competition || 'FRIENDLY').toUpperCase() : null;
        const isNewComp = idx === 0 || currentComp !== prevComp;

        return (
          <React.Fragment key={m.id}>
            {isNewComp && (
              <div className="flex items-center gap-2 pt-4 pb-2 border-b border-sky-400/20 mt-4 first:mt-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{m.competition || 'FRIENDLY'}</span>
                  {m.seasonName && (
                    <span className="text-slate-400 font-mono text-[11px] font-bold">
                      {m.seasonName.replace(/[^0-9]/g, '') || m.seasonName}
                    </span>
                  )}
                </h3>
              </div>
            )}
            <MatchCard match={m} teamName={teamName} teamLogo={teamLogo} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; season?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieSeason = cookieStore.get('public_season')?.value;

  const { seasons, allMatchesRaw: allRaw, systemSetting } = await getCachedMatchesData();
  const displayTeamName = systemSetting?.teamName || 'TEAM';
  const displayTeamLogo = systemSetting?.teamLogo || '/defaultteam.webp';

  const defaultSeason = seasons.find((s) => s.isCurrent)?.name || seasons[0]?.name || '2026';
  const filter = params.filter || 'all';
  const selectedSeason = params.season || (cookieSeason && seasons.some((s) => s.name === cookieSeason) ? cookieSeason : defaultSeason);

  const allMatchesRaw = selectedSeason !== 'all'
    ? allRaw.filter((m: any) => m.seasonName === selectedSeason)
    : allRaw;

  // Computed Dynamic Status
  const matchesWithStatus = allMatchesRaw.map((m) => ({
    ...m,
    computedStatus: getDynamicMatchStatus(m),
  }));

  // Upcoming / Live: terdekat dulu (ASC)
  const upcomingMatches = matchesWithStatus
    .filter((m) => m.computedStatus === 'scheduled' || m.computedStatus === 'live')
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  // Finished / History: terbaru dulu (DESC)
  const finishedMatches = matchesWithStatus
    .filter((m) => m.computedStatus === 'finished' || m.computedStatus === 'score_pending')
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const filteredMatches =
    filter === 'upcoming' ? upcomingMatches :
    filter === 'finished' ? finishedMatches : [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

      {/* Filter Tabs (Navbar Underline Style) */}
      <div className="flex items-center justify-start gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <Link
          href={`/matches?filter=all${selectedSeason && selectedSeason !== 'all' ? `&season=${encodeURIComponent(selectedSeason)}` : ''}`}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
            filter === 'all'
              ? 'text-blue-600 border-blue-600 font-black'
              : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Semua ({allMatchesRaw.length})
        </Link>
        <Link
          href={`/matches?filter=upcoming${selectedSeason && selectedSeason !== 'all' ? `&season=${encodeURIComponent(selectedSeason)}` : ''}`}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
            filter === 'upcoming'
              ? 'text-blue-600 border-blue-600 font-black'
              : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Mendatang ({upcomingMatches.length})
        </Link>
        <Link
          href={`/matches?filter=finished${selectedSeason && selectedSeason !== 'all' ? `&season=${encodeURIComponent(selectedSeason)}` : ''}`}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
            filter === 'finished'
              ? 'text-blue-600 border-blue-600 font-black'
              : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Selesai ({finishedMatches.length})
        </Link>
      </div>

      {/* Matches List */}
      {filter === 'all' ? (
        <div className="space-y-10">
          {/* ── Laga Mendatang ── */}
          {upcomingMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  Laga Mendatang
                </h2>
                <span className="text-[10px] font-bold text-slate-500">({upcomingMatches.length})</span>
              </div>
              <MatchListGroupedByCompetition matches={upcomingMatches} teamName={displayTeamName} teamLogo={displayTeamLogo} />
            </div>
          )}

          {/* ── Riwayat Pertandingan ── */}
          {finishedMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-5 rounded-full bg-emerald-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  Riwayat Pertandingan
                </h2>
                <span className="text-[10px] font-bold text-slate-500">({finishedMatches.length})</span>
              </div>
              <MatchListGroupedByCompetition matches={finishedMatches} teamName={displayTeamName} teamLogo={displayTeamLogo} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <MatchListGroupedByCompetition matches={filteredMatches} teamName={displayTeamName} teamLogo={displayTeamLogo} />
        </div>
      )}
    </div>
  );
}
