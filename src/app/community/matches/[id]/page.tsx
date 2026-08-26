import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  ArrowLeft, Calendar, MapPin, Users, Activity,
  Clock, Shield, Award, CheckCircle2, Play
} from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';

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

  const teamAPlayers = funMatch.attendances.filter((a) => a.assignedTeam === 'TEAM_A' && a.status === 'CONFIRMED');
  const teamBPlayers = funMatch.attendances.filter((a) => a.assignedTeam === 'TEAM_B' && a.status === 'CONFIRMED');
  const unassignedPlayers = funMatch.attendances.filter((a) => !a.assignedTeam && a.status === 'CONFIRMED');

  const teamAEvents = funMatch.events.filter((e) => e.team === 'TEAM_A');
  const teamBEvents = funMatch.events.filter((e) => e.team === 'TEAM_B');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Back Button */}
      <div>
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Soccer Community
        </Link>
      </div>

      {/* Main Match Header Scorecard */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-900 shadow-2xl">
        
        {/* Matchday & Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-bold uppercase">
          <span className="text-sky-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Fun Match Internal Community
          </span>
          <span className="text-slate-400">
            {formatWibDate(funMatch.matchDate, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} • {formatWibTime(funMatch.matchDate)} WIB
          </span>
        </div>

        {/* Teams & Score */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-center">
          
          {/* Team A */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-900/60 border-2 border-sky-400/50 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-500/10">
              A
            </div>
            <h3 className="text-sm sm:text-lg font-black uppercase text-white tracking-wide">
              {funMatch.teamAName}
            </h3>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-sky-400">
              {teamAPlayers.length} Pemain
            </span>
          </div>

          {/* Center Score */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/80 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-slate-800">
              <span className="text-3xl sm:text-5xl font-black text-white">
                {funMatch.teamAScore !== null ? funMatch.teamAScore : '-'}
              </span>
              <span className="text-xl sm:text-3xl font-black text-slate-600">:</span>
              <span className="text-3xl sm:text-5xl font-black text-white">
                {funMatch.teamBScore !== null ? funMatch.teamBScore : '-'}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 mt-1">
              {funMatch.status === 'finished' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Time ({funMatch.duration} Menit)
                </span>
              ) : funMatch.status === 'live' ? (
                <span className="text-red-400 animate-pulse flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-red-400" /> Sedang Berlangsung
                </span>
              ) : (
                'Jadwal Mendatang'
              )}
            </span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-950/60 border-2 border-amber-400/50 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-500/10">
              B
            </div>
            <h3 className="text-sm sm:text-lg font-black uppercase text-white tracking-wide">
              {funMatch.teamBName}
            </h3>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-amber-400">
              {teamBPlayers.length} Pemain
            </span>
          </div>

        </div>

        {/* Venue Info */}
        <div className="text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>{funMatch.venue}</span>
        </div>

      </div>

      {/* 2 SISI SUMMARY (TIM A vs TIM B) */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          Ringkasan Pertandingan (Match Summary)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tim A Summary Box */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-blue-500/30 bg-blue-950/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-sky-300">{funMatch.teamAName}</span>
              <span className="text-xs font-bold text-white">{teamAEvents.filter(e => e.type === 'goal').length} Gol</span>
            </div>
            {teamAEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Belum ada catatan event gol/kartu.</p>
            ) : (
              <div className="space-y-2">
                {teamAEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-slate-200">
                    <span className="font-mono text-sky-400 font-bold">{e.minute}&apos;</span>
                    <span className="font-bold">
                      {e.type === 'goal' && '⚽ Gol:'}
                      {e.type === 'assist' && '👟 Assist:'}
                      {e.type === 'yellow_card' && '🟨 Kartu Kuning:'}
                      {e.type === 'red_card' && '🟥 Kartu Merah:'}
                    </span>
                    <span>{e.member?.fullName || e.playerName || 'Pemain'}</span>
                    {e.description && <span className="text-slate-400">({e.description})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tim B Summary Box */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-amber-300">{funMatch.teamBName}</span>
              <span className="text-xs font-bold text-white">{teamBEvents.filter(e => e.type === 'goal').length} Gol</span>
            </div>
            {teamBEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Belum ada catatan event gol/kartu.</p>
            ) : (
              <div className="space-y-2">
                {teamBEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-slate-200">
                    <span className="font-mono text-amber-400 font-bold">{e.minute}&apos;</span>
                    <span className="font-bold">
                      {e.type === 'goal' && '⚽ Gol:'}
                      {e.type === 'assist' && '👟 Assist:'}
                      {e.type === 'yellow_card' && '🟨 Kartu Kuning:'}
                      {e.type === 'red_card' && '🟥 Kartu Merah:'}
                    </span>
                    <span>{e.member?.fullName || e.playerName || 'Pemain'}</span>
                    {e.description && <span className="text-slate-400">({e.description})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2 SISI LINEUP (SUSUNAN PEMAIN TIM A vs TIM B) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          Susunan Pemain (Lineup Tim A & Tim B)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tim A Lineup Box */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase text-sky-400">
                Lineup {funMatch.teamAName} ({teamAPlayers.length} Pemain)
              </h3>
            </div>
            {teamAPlayers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Belum ada pemain di Tim A.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamAPlayers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <img
                      src={p.member?.photoUrl || '/defaultplayer.png'}
                      alt={p.playerName || ''}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate block">
                          {p.member?.nickname || p.playerName}
                        </span>
                        <span className="text-[10px] font-black text-amber-400">
                          #{p.member?.jerseyNumber || 30}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-sky-400">
                        {p.member?.position || 'MF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tim B Lineup Box */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase text-amber-400">
                Lineup {funMatch.teamBName} ({teamBPlayers.length} Pemain)
              </h3>
            </div>
            {teamBPlayers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Belum ada pemain di Tim B.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamBPlayers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <img
                      src={p.member?.photoUrl || '/defaultplayer.png'}
                      alt={p.playerName || ''}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate block">
                          {p.member?.nickname || p.playerName}
                        </span>
                        <span className="text-[10px] font-black text-amber-400">
                          #{p.member?.jerseyNumber || 30}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-amber-400">
                        {p.member?.position || 'MF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Unassigned Pool If any */}
        {unassignedPlayers.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Pemain Konfirmasi Hadir (Belum Dibagi Tim oleh Admin):
            </span>
            <div className="flex flex-wrap gap-2">
              {unassignedPlayers.map((p) => (
                <span key={p.id} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
                  {p.member?.fullName} (#{p.member?.jerseyNumber}) - {p.member?.position}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
