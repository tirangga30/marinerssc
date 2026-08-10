import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import TacticalPitch from '@/components/TacticalPitch';
import { Shield, Calendar, MapPin, Trophy, Clock, ArrowLeft, Activity, Flag } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back Button */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Jadwal & Hasil
      </Link>

      {/* Main Score Board Header */}
      <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-bold text-amber-400 uppercase">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> {match.competition}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(match.matchDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center p-3 shadow-lg shadow-amber-500/20">
              {match.isHome ? (
                <Shield className="w-12 h-12 text-amber-400" />
              ) : (
                <img src={match.opponentLogo} alt={match.opponentName} className="w-full h-full object-contain" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-100 uppercase">
              {match.isHome ? 'MARINERS FC' : match.opponentName}
            </h2>
            <span className="text-xs text-amber-400 font-semibold uppercase">Tuan Rumah</span>
          </div>

          {/* Score Box */}
          <div className="space-y-2">
            {match.status === 'finished' ? (
              <div>
                <div className="text-5xl sm:text-6xl font-black font-mono gold-gradient-text tracking-widest">
                  {match.homeScore} : {match.awayScore}
                </div>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                  Pertandingan Selesai
                </span>
              </div>
            ) : (
              <div>
                <div className="inline-block px-6 py-2 rounded-2xl bg-amber-500/20 text-amber-400 text-3xl font-black border border-amber-500/40">
                  VS
                </div>
                <p className="text-xs text-amber-400 font-bold uppercase mt-2">Mendatang</p>
              </div>
            )}
            <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1 mt-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {match.venue}
            </p>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center p-3 shadow-lg">
              {!match.isHome ? (
                <Shield className="w-12 h-12 text-amber-400" />
              ) : (
                <img src={match.opponentLogo} alt={match.opponentName} className="w-full h-full object-contain" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-100 uppercase">
              {!match.isHome ? 'MARINERS FC' : match.opponentName}
            </h2>
            <span className="text-xs text-slate-400 font-semibold uppercase">Tamu</span>
          </div>

        </div>

        {match.summary && (
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-300 max-w-2xl mx-auto italic">
            "{match.summary}"
          </div>
        )}
      </div>

      {/* Main Grid: Tactical Pitch & Match Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col (7 cols): Tactical Pitch 2D */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black uppercase text-slate-100">Susunan Pemain & Taktik 2D</h3>
          </div>

          <TacticalPitch lineups={match.lineups} formation={match.formation} />
        </div>

        {/* Right Col (5 cols): Match Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black uppercase text-slate-100">Timeline Pertandingan</h3>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            {match.events.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Belum ada event tercatat untuk pertandingan ini.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                {match.events.map((event) => (
                  <div key={event.id} className="relative group">
                    
                    {/* Minute Circle Badge */}
                    <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 text-[10px] font-black flex items-center justify-center">
                      {event.minute}'
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="uppercase text-amber-400 flex items-center gap-1.5">
                          {event.type === 'goal' && '⚽ GOL!'}
                          {event.type === 'yellow_card' && '🟨 Kartu Kuning'}
                          {event.type === 'red_card' && '🟥 Kartu Merah'}
                          {event.type === 'sub' && '🔄 Pergantian Pemain'}
                        </span>
                      </div>

                      <div className="text-sm font-extrabold text-slate-100">
                        {event.player.name}
                      </div>

                      {event.assistPlayer && (
                        <div className="text-xs text-amber-400/90 font-medium">
                          Assist: {event.assistPlayer.name}
                        </div>
                      )}

                      {event.description && (
                        <div className="text-xs text-slate-400 italic pt-1">
                          "{event.description}"
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
