import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatWibDate, formatWibTime } from '@/lib/date';
import MatchTimer from '@/components/MatchTimer';
import { Calendar, Sparkles, MapPin, Clock, ArrowRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

function FunMatchCard({ match }: { match: any }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <Link
      href={`/community/matches/${match.id}`}
      className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-amber-400/30 hover:border-amber-400/60 shadow-2xl shadow-slate-950 hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer"
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
        {isLive ? (
          <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE FUN MATCH
          </span>
        ) : isFinished ? (
          <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border bg-emerald-500/15 text-emerald-400 border-emerald-500/40">
            SELESAI
          </span>
        ) : (
          <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border bg-amber-500/15 text-amber-300 border-amber-500/40">
            MENDATANG
          </span>
        )}

        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-xs font-medium text-slate-400">
            {formatWibDate(match.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-400/30">
            Matchday {match.matchday || 1}
          </span>
        </span>
      </div>

      {/* Main Scoreboard Content */}
      <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">

        {/* Team A */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
          <div className="order-2 sm:order-1 text-center sm:text-right">
            <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-amber-200 transition-colors">
              {match.teamAName}
            </h4>
          </div>
          <div className="order-1 sm:order-2 w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-blue-950/80 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-sm sm:text-2xl shadow-lg">
            A
          </div>
        </div>

        {/* Score / VS */}
        <div className="space-y-0.5 sm:space-y-2">
          {match.teamAScore !== null && match.teamBScore !== null ? (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium uppercase">
                {isFinished ? 'FULL TIME' : isLive ? 'LIVE' : 'SKOR'}
              </p>
              <div className="text-xl sm:text-5xl font-black font-mono text-amber-400 tracking-widest">
                {match.teamAScore} : {match.teamBScore}
              </div>
            </>
          ) : (
            <>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                {formatWibTime(match.matchDate)}
              </p>
              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-600/30 text-amber-300 font-black text-xs sm:text-2xl border border-amber-400/50">
                VS
              </div>
            </>
          )}
          <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">{match.venue}</p>
        </div>

        {/* Team B */}
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
          <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-amber-950/80 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-sm sm:text-2xl shadow-lg">
            B
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-amber-200 transition-colors">
              {match.teamBName}
            </h4>
          </div>
        </div>

      </div>

      {!isFinished && (
        <MatchTimer
          targetDate={match.matchDate}
          status={match.status}
          duration={match.duration || 60}
          isLiveEnabled={true}
        />
      )}
    </Link>
  );
}

export default async function CommunityMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'all';

  let allMatches: any[] = [];
  try {
    allMatches = await prisma.funMatch.findMany({
      include: {
        events: true,
      },
      orderBy: { matchDate: 'asc' },
    });
  } catch (e) {
    console.error('Error fetching fun matches:', e);
  }

  const matchesWithDay = allMatches.map((m, idx) => ({
    ...m,
    matchday: idx + 1,
  }));

  // Upcoming / Live: terdekat dulu (ASC)
  const upcomingMatches = matchesWithDay
    .filter((m) => m.status === 'scheduled' || m.status === 'live')
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  // Finished: terbaru dulu (DESC)
  const finishedMatches = matchesWithDay
    .filter((m) => m.status === 'finished')
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const filteredMatches =
    filter === 'upcoming' ? upcomingMatches :
    filter === 'finished' ? finishedMatches : [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

      {/* Header Banner (IDENTIK DENGAN TIM UTAMA) */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl border border-amber-400/20 text-center space-y-2 relative overflow-hidden bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400">
          Jadwal &amp; Hasil Fun Match
        </span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Season 2026/2027
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Pantau seluruh jadwal fun match mendatang dan rekap hasil pertandingan Soccer Community Mariners SC.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-1.5 sm:gap-2">
        <Link
          href="/community/matches?filter=all"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'bg-amber-400 text-blue-950 font-black shadow-lg shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-300'
          }`}
        >
          Semua ({allMatches.length})
        </Link>
        <Link
          href="/community/matches?filter=upcoming"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'upcoming'
              ? 'bg-amber-400 text-blue-950 font-black shadow-lg shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-300'
          }`}
        >
          Mendatang ({upcomingMatches.length})
        </Link>
        <Link
          href="/community/matches?filter=finished"
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'finished'
              ? 'bg-amber-400 text-blue-950 font-black shadow-lg shadow-amber-500/20'
              : 'glass-panel text-slate-300 hover:text-amber-300'
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
                <span className="w-1 h-5 rounded-full bg-amber-400 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Laga Mendatang</h2>
                <span className="text-[10px] font-bold text-slate-500">({upcomingMatches.length})</span>
              </div>
              <div className="space-y-2">
                {upcomingMatches.map((m) => <FunMatchCard key={m.id} match={m} />)}
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
                {finishedMatches.map((m) => <FunMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-2">
          {filteredMatches.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">Tidak ada pertandingan.</p>
          ) : (
            filteredMatches.map((m) => <FunMatchCard key={m.id} match={m} />)
          )}
        </div>
      )}

    </div>
  );
}
