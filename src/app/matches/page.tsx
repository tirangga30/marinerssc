import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { Trophy, Calendar } from 'lucide-react';

export const revalidate = 60;

const getCachedMatchesData = unstable_cache(
  async () => {
    try {
      const [seasons, allMatchesRaw] = await Promise.all([
        prisma.season.findMany({
          orderBy: { year: 'desc' },
          select: { id: true, name: true, year: true, isCurrent: true },
        }),
        prisma.footballMatch.findMany({
          include: { events: true },
          orderBy: { matchDate: 'asc' },
        }),
      ]);
      return { seasons, allMatchesRaw };
    } catch (e) {
      console.warn('Database unreachable in getCachedMatchesData, fallback to empty arrays:', e);
      return { seasons: [], allMatchesRaw: [] };
    }
  },
  ['mariners-matches-page-cache'],
  { revalidate: 60, tags: ['matches', 'seasons'] }
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

function MatchCard({ match }: { match: any }) {
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
          {displayStage && (
            <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {displayStage}
            </span>
          )}
        </span>
      </div>

      {/* Main Scoreboard Content */}
      <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
        {/* Home Team */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
          <div className="order-2 sm:order-1 text-center sm:text-right">
            <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">
              {match.isHome ? 'MARINERS SC' : match.opponentName}
            </h4>
          </div>
          <div className="order-1 sm:order-2 flex items-center justify-center">
            <img
              src={match.isHome ? '/marinerssc.webp' : (match.opponentLogo || '/defaultteam.webp')}
              alt={match.isHome ? 'Mariners SC' : match.opponentName}
              className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Score / VS Badge */}
        <div className="space-y-0.5 sm:space-y-2">
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
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium">FULL TIME</p>
              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200">
                VS
              </div>
            </>
          ) : status === 'finished' ? (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium">FULL TIME</p>
              <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                {match.homeScore ?? 0} : {match.awayScore ?? 0}
              </div>
            </>
          ) : (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium">
                {formatWibTime(match.matchDate)}
              </p>
              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200">
                VS
              </div>
            </>
          )}
          <p className="text-[8px] sm:text-[10px] text-slate-500 truncate max-w-xs mx-auto">
            {match.venue}
          </p>
        </div>

        {/* Away Team */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
          <div className="flex items-center justify-center">
            <img
              src={!match.isHome ? '/marinerssc.webp' : (match.opponentLogo || '/defaultteam.webp')}
              alt={!match.isHome ? 'Mariners SC' : match.opponentName}
              className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">
              {!match.isHome ? 'MARINERS SC' : match.opponentName}
            </h4>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MatchListGroupedByCompetition({ matches }: { matches: any[] }) {
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
            <MatchCard match={m} />
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

  const { seasons, allMatchesRaw: allRaw } = await getCachedMatchesData();

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
              <MatchListGroupedByCompetition matches={upcomingMatches} />
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
              <MatchListGroupedByCompetition matches={finishedMatches} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <MatchListGroupedByCompetition matches={filteredMatches} />
        </div>
      )}
    </div>
  );
}
