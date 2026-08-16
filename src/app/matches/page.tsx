import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';

export const revalidate = 0;

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

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
        {status === 'live' ? (
          <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
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
          <span className="text-[9px] sm:text-xs font-medium text-slate-400">
            {new Date(match.matchDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
            Matchday {match.matchday}
          </span>
        </span>
      </div>

      {/* Main Scoreboard Content */}
      <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">

        {/* Home Team */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
          <div className="order-2 sm:order-1 text-center sm:text-right">
            <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
              {match.isHome ? 'MARINERS SC' : match.opponentName}
            </h4>
          </div>
          <div className="order-1 sm:order-2 flex items-center justify-center">
            <img
              src={match.isHome ? '/marinerssc.png' : (match.opponentLogo || '/defaultteam.png')}
              alt={match.isHome ? 'Mariners SC' : match.opponentName}
              className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
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
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                VS
              </div>
            </>
          ) : status === 'finished' ? (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
              <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                {match.homeScore ?? 0} : {match.awayScore ?? 0}
              </div>
            </>
          ) : (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                {`${new Date(match.matchDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB`}
              </p>
              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                VS
              </div>
            </>
          )}
          <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">
            {match.venue}
          </p>
        </div>

        {/* Away Team */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
          <div className="flex items-center justify-center">
            <img
              src={!match.isHome ? '/marinerssc.png' : (match.opponentLogo || '/defaultteam.png')}
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
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'all';

  const allMatches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'asc' },
  });

  // Hitung Matchday & Computed Dynamic Status
  const matchesWithMatchday = allMatches.map((m, index) => ({
    ...m,
    matchday: index + 1,
    computedStatus: getDynamicMatchStatus(m),
  }));

  // Upcoming / Live: terdekat dulu (ASC)
  const upcomingMatches = matchesWithMatchday
    .filter((m) => m.computedStatus === 'scheduled' || m.computedStatus === 'live')
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  // Finished / History: terbaru dulu (DESC) — termasuk match dengan status score_pending
  const finishedMatches = matchesWithMatchday
    .filter((m) => m.computedStatus === 'finished' || m.computedStatus === 'score_pending')
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const filteredMatches =
    filter === 'upcoming' ? upcomingMatches :
    filter === 'finished' ? finishedMatches : [];

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
            filter === 'all' ? 'white-blue-btn' : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Semua ({allMatches.length})
        </Link>
        <Link
          href="/matches?filter=upcoming"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'upcoming' ? 'white-blue-btn' : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Mendatang ({upcomingMatches.length})
        </Link>
        <Link
          href="/matches?filter=finished"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'finished' ? 'white-blue-btn' : 'glass-panel text-slate-300 hover:text-sky-300'
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
                <span className="w-1 h-5 rounded-full bg-sky-400 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Laga Mendatang</h2>
                <span className="text-[10px] font-bold text-slate-500">({upcomingMatches.length})</span>
              </div>
              <div className="space-y-2">
                {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

          {/* ── Riwayat Pertandingan ── */}
          {finishedMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-5 rounded-full bg-emerald-400 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Riwayat Pertandingan</h2>
                <span className="text-[10px] font-bold text-slate-500">({finishedMatches.length})</span>
              </div>
              <div className="space-y-2">
                {finishedMatches.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-2">
          {filteredMatches.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">Tidak ada pertandingan.</p>
          ) : (
            filteredMatches.map((m) => <MatchCard key={m.id} match={m} />)
          )}
        </div>
      )}

    </div>
  );
}
