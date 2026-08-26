import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import CommunityMatchTabs from '@/components/CommunityMatchTabs';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { Calendar, MapPin, Sparkles, ArrowLeft, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FunMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const funMatch = await prisma.funMatch.findUnique({
    where: { id },
    include: {
      attendances: {
        include: { member: true },
        orderBy: { createdAt: 'asc' },
      },
      events: {
        include: { member: true },
        orderBy: { minute: 'asc' },
      },
    },
  });

  if (!funMatch) {
    notFound();
  }

  const isLive = funMatch.status === 'live';
  const isFinished = funMatch.status === 'finished';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
      
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/community/matches"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Jadwal Fun Match</span>
        </Link>
        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
          SOCCER COMMUNITY
        </span>
      </div>

      {/* Main Score Board Header - EXACT MATCHING DESIGN */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-400/30 text-center space-y-4 relative overflow-hidden bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14] shadow-2xl">
        
        {/* Top bar with matchday & time */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[10px] sm:text-xs font-bold uppercase">
          {isLive ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE FUN MATCH
            </span>
          ) : (
            <span className="text-amber-400">
              {funMatch.title || 'Fun Match Weekly'}
            </span>
          )}
          <span className="text-slate-400">
            {formatWibDate(funMatch.matchDate, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} • {formatWibTime(funMatch.matchDate)} WIB
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-center">
          
          {/* Team A */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-blue-950/90 border border-sky-400/50 flex items-center justify-center text-sky-400 font-black text-xl sm:text-3xl shadow-xl">
              A
            </div>
            <h2 className="text-xs sm:text-xl font-black text-sky-300 uppercase">
              {funMatch.teamAName}
            </h2>
          </div>

          {/* Score Box */}
          <div className="-mt-2 space-y-1">
            {isFinished ? (
              <div>
                <span className="inline-block mb-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase border border-emerald-500/30">
                  Full Time
                </span>
                <div className="text-3xl sm:text-6xl font-black font-mono text-amber-400 tracking-widest">
                  {funMatch.teamAScore ?? 0} : {funMatch.teamBScore ?? 0}
                </div>
              </div>
            ) : isLive ? (
              <div>
                <span className="inline-block mb-1.5 px-3 py-0.5 rounded-full bg-red-600/30 text-red-400 text-[10px] sm:text-xs font-bold uppercase border border-red-500/50 animate-pulse">
                  Sedang Berlangsung
                </span>
                <div className="text-3xl sm:text-6xl font-black font-mono text-amber-400 tracking-widest">
                  {funMatch.teamAScore ?? 0} : {funMatch.teamBScore ?? 0}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase mb-1.5">Mendatang</p>
                <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-amber-600/30 text-amber-300 text-xl sm:text-3xl font-black border border-amber-400/40">
                  VS
                </div>
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1 truncate max-w-xs mx-auto">
              📍 {funMatch.venue}
            </p>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-amber-950/90 border border-amber-400/50 flex items-center justify-center text-amber-400 font-black text-xl sm:text-3xl shadow-xl">
              B
            </div>
            <h2 className="text-xs sm:text-xl font-black text-amber-300 uppercase">
              {funMatch.teamBName}
            </h2>
          </div>

        </div>

      </div>

      {/* 2 SISI CONTENT TABS (LINE UP & SUMMARY) */}
      <CommunityMatchTabs funMatch={funMatch as any} />

    </div>
  );
}
