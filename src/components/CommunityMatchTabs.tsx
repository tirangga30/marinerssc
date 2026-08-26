'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Users, Clock, Shield, Activity, UserCheck,
  Play, CheckCircle2, Award, Flame, Sparkles
} from 'lucide-react';

const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

interface Member {
  id: string;
  fullName: string;
  nickname: string | null;
  position: string;
  jerseyNumber: number;
  photoUrl: string | null;
  tier: string;
}

interface AttendanceItem {
  id: string;
  memberId: string | null;
  playerId: string | null;
  playerType: string;
  playerName: string | null;
  status: string;
  assignedTeam: string | null;
  member: Member | null;
}

interface FunMatchEventItem {
  id: string;
  funMatchId: string;
  memberId: string | null;
  playerName: string | null;
  team: string;
  type: string;
  minute: number;
  description: string | null;
  member: Member | null;
}

interface CommunityMatchTabsProps {
  funMatch: {
    id: string;
    title: string;
    matchDate: Date | string;
    venue: string;
    teamAName: string;
    teamBName: string;
    teamALogo: string | null;
    teamBLogo: string | null;
    teamAScore: number | null;
    teamBScore: number | null;
    status: string;
    duration: number;
    attendances: AttendanceItem[];
    events: FunMatchEventItem[];
  };
}

export default function CommunityMatchTabs({ funMatch }: CommunityMatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'lineup' | 'summary'>('lineup');

  const teamAPlayers = (funMatch.attendances || []).filter(
    (a) => a.assignedTeam === 'TEAM_A' && a.status === 'CONFIRMED'
  );
  const teamBPlayers = (funMatch.attendances || []).filter(
    (a) => a.assignedTeam === 'TEAM_B' && a.status === 'CONFIRMED'
  );
  const unassignedPlayers = (funMatch.attendances || []).filter(
    (a) => !a.assignedTeam && a.status === 'CONFIRMED'
  );

  const teamAEvents = (funMatch.events || []).filter((e) => e.team === 'TEAM_A');
  const teamBEvents = (funMatch.events || []).filter((e) => e.team === 'TEAM_B');

  // Sorted timeline events
  const allEventsChronological = [...(funMatch.events || [])].sort((a, b) => a.minute - b.minute);

  // Helper: Get events for a specific member in this match
  const getMemberEvents = (memberId?: string | null, playerName?: string | null) => {
    if (!memberId && !playerName) return [];
    return (funMatch.events || []).filter(
      (e) => (memberId && e.memberId === memberId) || (playerName && e.playerName === playerName)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* ─── SLIDE TOGGLE SWITCHER (IDENTIK DENGAN TIM UTAMA MATCHTABS) ─── */}
      <div className="flex items-center justify-center gap-2 p-1.5 glass-panel rounded-2xl max-w-sm mx-auto border border-sky-400/20 shadow-lg shadow-sky-950/40">
        <button
          onClick={() => setActiveTab('lineup')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'lineup'
              ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Line Up</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'summary'
              ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: LINE UP (2 SISI: TIM A vs TIM B)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'lineup' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* SISI KIRI: TIM A */}
            <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 bg-gradient-to-b from-[#091426] via-[#060b14] to-[#0a1526] space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-900/60 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-sm">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase text-sky-300">
                      {funMatch.teamAName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {teamAPlayers.length} Pemain Terdaftar
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30 font-mono font-black text-xs">
                  {funMatch.teamAScore ?? 0} GOL
                </span>
              </div>

              {teamAPlayers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Belum ada susunan pemain yang dibagi ke Tim A.
                </div>
              ) : (
                <div className="space-y-2">
                  {teamAPlayers.map((p) => {
                    const memberId = p.member?.id;
                    const displayName = p.member?.nickname || p.member?.fullName || p.playerName || 'Pemain';
                    const jerseyNum = p.member?.jerseyNumber || 30;
                    const position = p.member?.position || 'MF';
                    const tier = p.member?.tier || 'FAN';
                    const photo = p.member?.photoUrl || '/playertemplate.png';
                    const evts = getMemberEvents(p.memberId, p.playerName);

                    return (
                      <Link
                        key={p.id}
                        href={memberId ? `/community/players/${memberId}` : '#'}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-sky-400/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Jersey Number */}
                          <span className="w-7 sm:w-8 text-center font-mono font-black text-base sm:text-lg text-sky-400 drop-shadow">
                            {jerseyNum}
                          </span>

                          {/* Member Photo */}
                          <img
                            src={photo}
                            alt={displayName}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />

                          {/* Name & Position */}
                          <div className="min-w-0">
                            <span className="font-extrabold text-white text-xs sm:text-sm group-hover:text-sky-300 transition-colors truncate block">
                              {displayName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-sky-400/90 tracking-wider">
                              {position}
                            </span>
                          </div>
                        </div>

                        {/* Match Event Badges if any */}
                        {evts.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0 pl-2">
                            {evts.map((e) => (
                              <span
                                key={e.id}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-200"
                                title={`${e.type.toUpperCase()} (${e.minute}')`}
                              >
                                {e.type === 'goal' && <BallIcon size={12} />}
                                {e.type === 'assist' && <span className="text-sky-400">👟</span>}
                                {e.type === 'yellow_card' && <span className="text-amber-400">🟨</span>}
                                {e.type === 'red_card' && <span className="text-rose-500">🟥</span>}
                                <span>{e.minute}&apos;</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

            {/* SISI KANAN: TIM B */}
            <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#1c160a] via-[#0b0c14] to-[#060b14] space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-amber-400/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-sm">
                    B
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase text-amber-300">
                      {funMatch.teamBName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {teamBPlayers.length} Pemain Terdaftar
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-400/30 font-mono font-black text-xs">
                  {funMatch.teamBScore ?? 0} GOL
                </span>
              </div>

              {teamBPlayers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Belum ada susunan pemain yang dibagi ke Tim B.
                </div>
              ) : (
                <div className="space-y-2">
                  {teamBPlayers.map((p) => {
                    const memberId = p.member?.id;
                    const displayName = p.member?.nickname || p.member?.fullName || p.playerName || 'Pemain';
                    const jerseyNum = p.member?.jerseyNumber || 30;
                    const position = p.member?.position || 'MF';
                    const tier = p.member?.tier || 'FAN';
                    const photo = p.member?.photoUrl || '/playertemplate.png';
                    const evts = getMemberEvents(p.memberId, p.playerName);

                    return (
                      <Link
                        key={p.id}
                        href={memberId ? `/community/players/${memberId}` : '#'}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-400/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Jersey Number */}
                          <span className="w-7 sm:w-8 text-center font-mono font-black text-base sm:text-lg text-amber-400 drop-shadow">
                            {jerseyNum}
                          </span>

                          {/* Member Photo */}
                          <img
                            src={photo}
                            alt={displayName}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />

                          {/* Name & Position */}
                          <div className="min-w-0">
                            <span className="font-extrabold text-white text-xs sm:text-sm group-hover:text-amber-300 transition-colors truncate block">
                              {displayName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-400/90 tracking-wider">
                              {position}
                            </span>
                          </div>
                        </div>

                        {/* Match Event Badges if any */}
                        {evts.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0 pl-2">
                            {evts.map((e) => (
                              <span
                                key={e.id}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-200"
                                title={`${e.type.toUpperCase()} (${e.minute}')`}
                              >
                                {e.type === 'goal' && <BallIcon size={12} />}
                                {e.type === 'assist' && <span className="text-sky-400">👟</span>}
                                {e.type === 'yellow_card' && <span className="text-amber-400">🟨</span>}
                                {e.type === 'red_card' && <span className="text-rose-500">🟥</span>}
                                <span>{e.minute}&apos;</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

          {/* Unassigned Pool If any */}
          {unassignedPlayers.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
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
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: SUMMARY (2 SISI TIMELINE: TIM A vs TIM B)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'summary' && (
        <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/20 space-y-6 animate-fadeIn">
          
          <div className="text-center space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-wider flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Timeline Pertandingan Fun Match
            </h2>
            <p className="text-xs text-slate-400">
              Catatan kejadian gol, assist, dan kartu sepanjang {funMatch.duration} menit pertandingan.
            </p>
          </div>

          {allEventsChronological.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-semibold">Belum ada catatan event pertandingan.</p>
            </div>
          ) : (
            <div className="relative max-w-3xl mx-auto py-4">
              
              {/* Central Timeline Line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-500 via-amber-500 to-slate-800" />

              <div className="space-y-6">
                {allEventsChronological.map((evt) => {
                  const isTeamA = evt.team === 'TEAM_A';
                  const memberName = evt.member?.nickname || evt.member?.fullName || evt.playerName || 'Pemain';
                  const jersey = evt.member?.jerseyNumber;

                  return (
                    <div
                      key={evt.id}
                      className={`relative flex items-center gap-3 sm:gap-6 ${
                        isTeamA ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      {/* Event Box (Left for Team A, Right for Team B) */}
                      <div className={`flex-1 ${isTeamA ? 'text-right' : 'text-left'}`}>
                        <div
                          className={`inline-block p-3 rounded-2xl border transition-all ${
                            isTeamA
                              ? 'bg-blue-950/70 border-sky-400/40 text-sky-200'
                              : 'bg-amber-950/70 border-amber-400/40 text-amber-200'
                          }`}
                        >
                          <div className={`flex items-center gap-2 ${isTeamA ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-black text-xs sm:text-sm text-white">
                              {memberName} {jersey ? `(#${jersey})` : ''}
                            </span>
                            <span className="text-xs">
                              {evt.type === 'goal' && <BallIcon size={14} />}
                              {evt.type === 'assist' && '👟'}
                              {evt.type === 'yellow_card' && '🟨'}
                              {evt.type === 'red_card' && '🟥'}
                            </span>
                          </div>

                          <div className="text-[10px] sm:text-xs text-slate-300 font-semibold mt-0.5">
                            {evt.type === 'goal' && 'Gol'}
                            {evt.type === 'assist' && 'Assist'}
                            {evt.type === 'yellow_card' && 'Kartu Kuning'}
                            {evt.type === 'red_card' && 'Kartu Merah'}
                            {evt.description && ` • ${evt.description}`}
                          </div>
                        </div>
                      </div>

                      {/* Central Minute Badge */}
                      <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-mono font-black text-xs text-white shadow-xl">
                        {evt.minute}&apos;
                      </div>

                      {/* Empty Placeholder on Opposite Side */}
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Match End / Fulltime Box */}
          {funMatch.status === 'finished' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 max-w-sm mx-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                FULL TIME • {funMatch.duration} MENIT
              </span>
              <div className="text-2xl font-black font-mono text-white">
                {funMatch.teamAScore ?? 0} : {funMatch.teamBScore ?? 0}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
