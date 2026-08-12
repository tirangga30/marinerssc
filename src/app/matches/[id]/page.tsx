import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatchTabs from '@/components/MatchTabs';
import { Calendar, MapPin, Trophy, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">
      
     

      {/* Main Score Board Header - NO BOX AROUND LOGOS */}
      <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-sky-400/30 text-center space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[10px] sm:text-xs font-bold uppercase">
          <span className="text-sky-400">
            {match.competition}
          </span>
          <span className="text-slate-400">
            {new Date(match.matchDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} • {new Date(match.matchDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-center">
          
          {/* Home Team - NO BOX */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center">
              <img
                src={match.isHome ? '/marinerssc.png' : match.opponentLogo}
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
            {match.status === 'finished' ? (
              <div>
                <span className="inline-block mb-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase border border-emerald-500/30">
                  Full Time
                </span>
                <div className="text-3xl sm:text-6xl font-black font-mono blue-gradient-text tracking-widest">
                  {match.homeScore} : {match.awayScore}
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
                src={!match.isHome ? '/marinerssc.png' : match.opponentLogo}
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
