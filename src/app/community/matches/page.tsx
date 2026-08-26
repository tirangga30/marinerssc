import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { Calendar, Sparkles, MapPin, Clock, ArrowRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CommunityMatchesPage() {
  let funMatches: any[] = [];

  try {
    funMatches = await prisma.funMatch.findMany({
      include: {
        events: true,
      },
      orderBy: { matchDate: 'desc' },
    });
  } catch (e) {
    console.error('Error fetching fun matches:', e);
  }

  const liveMatches = funMatches.filter((m) => m.status === 'live');
  const upcomingMatches = funMatches.filter((m) => m.status === 'scheduled');
  const finishedMatches = funMatches.filter((m) => m.status === 'finished');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-amber-400/30 text-center space-y-3 bg-gradient-to-b from-[#15120a] via-[#090b14] to-[#060b14] shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Soccer Community</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Jadwal & Hasil Fun Match
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Daftar seluruh pertandingan fun match internal mingguan Soccer Community Mariners SC.
        </p>
      </div>

      {/* MATCHES LIST */}
      {funMatches.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white uppercase">Belum ada jadwal pertandingan fun match</h3>
          <p className="text-xs text-slate-400">Jadwal fun match mingguan akan segera diumumkan oleh admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {funMatches.map((m: any) => {
            const isFinished = m.status === 'finished';
            const isLive = m.status === 'live';

            return (
              <Link
                key={m.id}
                href={`/community/matches/${m.id}`}
                className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-amber-400/20 hover:border-amber-400/60 shadow-2xl shadow-slate-950 hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer"
              >
                {/* Top Bar Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
                  {isLive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE FUN MATCH
                    </span>
                  ) : isFinished ? (
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      SELESAI
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      MENDATANG
                    </span>
                  )}

                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                      {formatWibDate(m.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-400/30">
                      SOCCER COMMUNITY
                    </span>
                  </span>
                </div>

                {/* Scoreboard Content */}
                <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                  
                  {/* Team A */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                    <div className="order-2 sm:order-1 text-center sm:text-right">
                      <h4 className="text-[10px] sm:text-xl font-black text-sky-300 uppercase group-hover:text-sky-200 transition-colors">
                        {m.teamAName}
                      </h4>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Tim A</span>
                    </div>
                    <div className="order-1 sm:order-2 w-10 sm:w-16 h-10 sm:h-16 rounded-2xl bg-blue-950/80 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-lg sm:text-2xl shadow-lg">
                      A
                    </div>
                  </div>

                  {/* Score */}
                  <div className="space-y-0.5 sm:space-y-2">
                    {isFinished ? (
                      <>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                        <div className="text-xl sm:text-5xl font-black font-mono text-amber-400 tracking-widest">
                          {m.teamAScore ?? 0} : {m.teamBScore ?? 0}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                          {formatWibTime(m.matchDate)} WIB
                        </p>
                        <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-600/30 text-amber-300 font-black text-xs sm:text-2xl border border-amber-400/50">
                          VS
                        </div>
                      </>
                    )}
                    <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">📍 {m.venue}</p>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                    <div className="w-10 sm:w-16 h-10 sm:h-16 rounded-2xl bg-amber-950/80 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-lg sm:text-2xl shadow-lg">
                      B
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-[10px] sm:text-xl font-black text-amber-300 uppercase group-hover:text-amber-200 transition-colors">
                        {m.teamBName}
                      </h4>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Tim B</span>
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
