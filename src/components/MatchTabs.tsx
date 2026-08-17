'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import TacticalPitch from '@/components/TacticalPitch';
import {
  FileText,
  Users,
  Clock,
  Shield,
  Activity,
  UserCheck,
  Play,
} from 'lucide-react';

const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

interface Player {
  id: string;
  name: string;
  slug: string;
  number: number;
  position: string;
  photoUrl: string;
  isGuest?: boolean;
}

interface LineupItem {
  id: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
  player: Player;
}

interface EventItem {
  id: string;
  minute: number;
  type: string;
  description: string | null;
  player: Player;
  assistPlayer: Player | null;
}

interface MatchTabsProps {
  match: {
    id: string;
    opponentName: string;
    opponentLogo: string;
    matchDate: Date | string;
    competition: string;
    venue: string;
    isHome: boolean;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    formation: string;
    summary: string | null;
    duration?: number;
    extraTime?: number;
    isLiveEnabled?: boolean;
    lineups: LineupItem[];
    events: EventItem[];
  };
}

export default function MatchTabs({ match }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup'>('lineup');

  const getPosWeight = (pos: string, pitchPos?: string): number => {
    const p = (pos || '').toUpperCase();
    const pitchP = (pitchPos || '').toUpperCase();

    if (p === 'GK' || p === 'GOALKEEPER' || pitchP === 'GK') return 1;
    if (p === 'DF' || p === 'DEFENDER' || ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF'].includes(pitchP)) return 2;
    if (p === 'MF' || p === 'MIDFIELDER' || ['CM', 'CAM', 'CDM', 'LM', 'RM', 'MF'].includes(pitchP)) return 3;
    if (p === 'FW' || p === 'FORWARD' || ['ST', 'CF', 'LW', 'RW', 'FW'].includes(pitchP)) return 4;
    return 5;
  };

  const sortLineupsByPosition = (list: LineupItem[]) => {
    return [...list].sort((a, b) => {
      const wA = getPosWeight(a.player?.position || a.positionName, a.pitchPosition);
      const wB = getPosWeight(b.player?.position || b.positionName, b.pitchPosition);
      if (wA !== wB) return wA - wB;
      return (a.player?.number || 0) - (b.player?.number || 0);
    });
  };

  const starters = sortLineupsByPosition(match.lineups.filter((l) => l.isStarter));
  const bench = sortLineupsByPosition(match.lineups.filter((l) => !l.isStarter));

  // Helper to find all events for a specific player in exact chronological minute order matching summary
  const getPlayerChronologicalEvents = (playerId: string) => {
    const rawEvts: Array<{ id: string; type: string; minute: number }> = [];

    (match.events || []).forEach((e, idx) => {
      const isPlayer = (e.player && e.player.id === playerId);
      const isAssist = (e.assistPlayer && e.assistPlayer.id === playerId);

      if (e.type === 'sub') {
        if (isPlayer) rawEvts.push({ id: `${e.id || idx}-subin`, type: 'sub_in', minute: e.minute });
        if (isAssist) rawEvts.push({ id: `${e.id || idx}-subout`, type: 'sub_out', minute: e.minute });
      } else if (e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty') {
        if (isPlayer) rawEvts.push({ id: `${e.id || idx}-${e.type}`, type: e.type, minute: e.minute });
        if (isAssist) rawEvts.push({ id: `${e.id || idx}-ast`, type: 'assist', minute: e.minute });
      } else if (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card') {
        if (isPlayer) rawEvts.push({ id: `${e.id || idx}-${e.type}`, type: e.type, minute: e.minute });
      }
    });

    return rawEvts.sort((a, b) => a.minute - b.minute);
  };

  // Hitung berapa kali setiap pemain KELUAR (digantikan) - bisa lebih dari 1x
  const subbedOutCount: Record<string, number> = {};
  match.events
    .filter((e) => e.type === 'sub' && e.assistPlayer?.id)
    .forEach((e) => {
      const id = e.assistPlayer!.id;
      subbedOutCount[id] = (subbedOutCount[id] || 0) + 1;
    });

  // Hitung berapa kali setiap pemain MASUK sebagai pengganti - bisa lebih dari 1x
  const subbedInCount: Record<string, number> = {};
  match.events
    .filter((e) => e.type === 'sub')
    .forEach((e) => {
      const id = e.player.id;
      subbedInCount[id] = (subbedInCount[id] || 0) + 1;
    });

  const pitchEvents = match.events.map((e) => ({
    id: e.id,
    playerId: e.player?.id || '',
    type: e.type,
    assistPlayerId: e.assistPlayer?.id || undefined,
  }));

  const dur = match.duration || 60;
  const htMinute = Math.floor(dur / 2);
  const ftMinute = dur;

  const startMs = new Date(match.matchDate).getTime();
  const nowMs = new Date().getTime();
  const elapsedMin = Math.floor((nowMs - startMs) / 60000);
  const isStarted = match.status === 'finished' || match.status === 'live' || nowMs >= startMs;

  const isLiveMode = match.isLiveEnabled !== false;

  // Filter raw events if in Non-Live mode and match is not finished yet
  let currentRawEvents = [...(match.events || [])];
  if (!isLiveMode && match.status !== 'finished') {
    currentRawEvents = currentRawEvents.filter((e) => e.minute <= Math.max(1, elapsedMin));
  }

  const timelineYellowCounts: Record<string, number> = {};
  const displayTimelineEvents: any[] = currentRawEvents.map((e) => {
    if (e.type === 'yellow_card' && e.player?.id) {
      timelineYellowCounts[e.player.id] = (timelineYellowCounts[e.player.id] || 0) + 1;
      if (timelineYellowCounts[e.player.id] >= 2) {
        return { ...e, type: 'second_yellow' };
      }
    }
    return e;
  });

  const hasK1 = displayTimelineEvents.some((e) => e.type === 'kickoff_1');
  const hasHT = displayTimelineEvents.some((e) => e.type === 'halftime');
  const hasK2 = displayTimelineEvents.some((e) => e.type === 'kickoff_2');
  const hasFT = displayTimelineEvents.some((e) => e.type === 'fulltime');

  if (isStarted) {
    if (!hasK1 && (match.status === 'finished' || elapsedMin >= 1)) {
      displayTimelineEvents.push({ id: 'AUTO-K1-MARKER', minute: 1, type: 'kickoff_1', isSystem: true });
    }

    if (!isLiveMode) {
      // In Non Live mode, auto markers ONLY appear progressively as elapsed match time passes
      if (!hasHT && (match.status === 'finished' || elapsedMin >= htMinute)) {
        displayTimelineEvents.push({ id: 'AUTO-HT-MARKER', minute: htMinute, type: 'halftime', isSystem: true });
      }
      if (!hasK2 && (match.status === 'finished' || elapsedMin >= htMinute + 1)) {
        displayTimelineEvents.push({ id: 'AUTO-K2-MARKER', minute: htMinute + 1, type: 'kickoff_2', isSystem: true });
      }
      if (!hasFT && (match.status === 'finished' || elapsedMin >= dur)) {
        displayTimelineEvents.push({ id: 'AUTO-FT-MARKER', minute: ftMinute, type: 'fulltime', isSystem: true });
      }
    } else if (match.status === 'finished') {
      if (!hasHT) displayTimelineEvents.push({ id: 'AUTO-HT-MARKER', minute: htMinute, type: 'halftime', isSystem: true });
      if (!hasK2) displayTimelineEvents.push({ id: 'AUTO-K2-MARKER', minute: htMinute + 1, type: 'kickoff_2', isSystem: true });
      if (!hasFT) displayTimelineEvents.push({ id: 'AUTO-FT-MARKER', minute: ftMinute, type: 'fulltime', isSystem: true });
    }
  }

  // Sort timeline events ascending by minute
  displayTimelineEvents.sort((a, b) => a.minute - b.minute);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ═══════════════════════════════════════════════════ */}
      {/* SLIDE TOGGLE BUTTONS                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-2 p-1.5 glass-panel rounded-2xl max-w-sm mx-auto border border-sky-400/20 shadow-lg shadow-sky-950/40">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'summary'
              ? 'blue-gradient-bg text-white shadow-md shadow-sky-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('lineup')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'lineup'
              ? 'blue-gradient-bg text-white shadow-md shadow-sky-500/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Line Up</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB CONTENT: SUMMARY & TIMELINE                    */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Text Box - ONLY SHOW IF NOT EMPTY */}
          {Boolean(match.summary && match.summary.trim()) && (
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-sky-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400">
                <Activity className="w-4 h-4 text-sky-400" />
                Ringkasan Laga
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "{match.summary}"
              </p>
            </div>
          )}

          {/* Timeline Section */}
          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-black uppercase text-sky-300 tracking-wide">
                Timeline Pertandingan
              </h3>
            </div>

            {displayTimelineEvents.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Shield className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  {match.status === 'scheduled' ? 'Pertandingan belum dimulai.' : 'Belum ada event tercatat untuk pertandingan ini.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-7 border-l border-slate-800 space-y-4 max-w-3xl mx-auto">
                {displayTimelineEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Minute Badge */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[9px] sm:text-[10px] font-mono font-bold flex items-center justify-center shadow">
                      {event.minute}'
                    </div>

                    <div className="bg-slate-900/80 p-3 sm:p-4 rounded-xl border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                        <span className="uppercase text-slate-400 flex items-center gap-1.5">
                          {event.type === 'goal' && (
                            <>
                              <BallIcon size={14} /> GOL!
                            </>
                          )}
                          {event.type === 'own_goal' && (
                            <>
                              <i className="fa-regular fa-futbol text-red-500 text-sm shrink-0" /> GOL BUNUH DIRI!
                            </>
                          )}
                          {event.type === 'penalty' && (
                            <>
                              <span className="relative inline-flex items-center shrink-0 mr-1">
                                <i className="fa-regular fa-futbol text-amber-400 text-xs" />
                                <span className="absolute -top-1.5 -right-2 w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black text-[7px] flex items-center justify-center leading-none shadow-sm">
                                  P
                                </span>
                              </span> GOL PENALTI!
                            </>
                          )}
                          {event.type === 'yellow_card' && (
                            <>
                              <span className="w-2.5 h-3.5 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-300/40" /> Kartu Kuning
                            </>
                          )}
                          {event.type === 'second_yellow' && (
                            <>
                              <span className="relative inline-flex items-center shrink-0 align-middle ml-1 mr-1.5" title="Kartu Kuning 2x (Kartu Merah)">
                                <span className="w-2.5 h-3.5 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-2px, -1px)' }} />
                                <span className="w-2.5 h-3.5 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                              </span> Kartu Kuning 2x (Merah)
                            </>
                          )}
                          {event.type === 'red_card' && (
                            <>
                              <span className="w-2.5 h-3.5 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40" /> Kartu Merah
                            </>
                          )}
                          {event.type === 'sub' && (
                            <>
                              <i className="fa-solid fa-right-left text-sky-400 shrink-0" /> Pergantian Pemain
                            </>
                          )}
                          {event.type === 'kickoff_1' && (
                            <span className="text-cyan-400 flex items-center gap-1"><Play className="w-3 h-3 fill-cyan-400" /> KICKOFF BABAK 1</span>
                          )}
                          {event.type === 'kickoff_2' && (
                            <span className="text-cyan-400 flex items-center gap-1"><Play className="w-3 h-3 fill-cyan-400" /> KICKOFF BABAK 2</span>
                          )}
                          {event.type === 'halftime' && (
                            <span className="text-sky-300">HALF-TIME</span>
                          )}
                          {event.type === 'fulltime' && (
                            <span className="text-sky-300">FULL-TIME</span>
                          )}
                        </span>
                      </div>

                      {event.isSystem || ['kickoff_1', 'kickoff_2', 'halftime', 'fulltime'].includes(event.type) ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          {event.type === 'kickoff_1' && 'Kickoff Babak Pertama'}
                          {event.type === 'kickoff_2' && 'Kickoff Babak Kedua'}
                          {event.type === 'halftime' && 'Babak Pertama Berakhir'}
                          {event.type === 'fulltime' && 'Pertandingan Selesai'}
                        </div>
                      ) : event.type === 'sub' ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span className="text-green-400">{event.player?.name}</span>
                          <i className="fa-solid fa-right-left text-sky-400 text-[10px]" />
                          {event.assistPlayer ? (
                            <span className="text-red-400">{event.assistPlayer.name}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          {event.player?.name}
                        </div>
                      )}

                      {!event.isSystem && event.type !== 'sub' && event.assistPlayer && (
                        <div className="text-[10px] sm:text-xs text-slate-400 font-medium flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-400 font-mono font-black text-[9px] inline-flex items-center justify-center">A</span>
                          <span>Assist:</span>
                          <span className="font-semibold text-slate-300">{event.assistPlayer.name}</span>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-[10px] sm:text-xs text-slate-400 italic pt-1 border-t border-slate-800/60 mt-1">
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
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB CONTENT: LINEUP & TACTICAL PITCH                */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === 'lineup' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Tactical Pitch 2D */}
          <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-sky-400/20">
            <TacticalPitch lineups={match.lineups} formation={match.formation} events={pitchEvents} />
          </div>

          {/* Lineup Detail Grid (Starting XI + Substitutes) */}
          <div className={`grid grid-cols-1 ${bench.length > 0 ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-4 sm:gap-6`}>
            {/* Starting XI List */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm sm:text-base font-black uppercase text-white">
                    Starting
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {starters.length} Pemain
                </span>
              </div>

              {starters.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Belum ada Starting XI tercatat.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {starters.map((item) => {
                    const chronEvts = getPlayerChronologicalEvents(item.player.id);
                    const subEvts = chronEvts.filter((e) => e.type === 'sub_in' || e.type === 'sub_out');
                    const matchEvts = chronEvts.filter((e) => e.type !== 'sub_in' && e.type !== 'sub_out');
                    const isGuest = item.player.isGuest;
                    const Content = (
                      <>
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-400/40 shrink-0 bg-slate-900">
                          <img
                            src={item.player.photoUrl || '/playertemplate.png'}
                            alt={item.player.name}
                            className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-sky-400 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate flex items-center gap-1">
                          {item.player.name}
                          {isGuest && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Loan</span>}
                          {subEvts.map((sub) => (
                            <i
                              key={sub.id}
                              className={`fa-solid fa-right-left text-[9px] shrink-0 ${
                                sub.type === 'sub_in' ? 'text-emerald-400' : 'text-red-500'
                              }`}
                              title={sub.type === 'sub_in' ? 'Masuk sebagai Pengganti' : 'Digantikan'}
                            />
                          ))}
                        </span>

                        {/* Match Event Badges — Chronological Order */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {matchEvts.map((e) => (
                            <span key={e.id} className="inline-flex items-center justify-center">
                              {e.type === 'goal' && <BallIcon size={11} />}
                              {e.type === 'own_goal' && <i className="fa-regular fa-futbol text-red-500 text-[10px] shrink-0" title="Gol Bunuh Diri" />}
                              {e.type === 'penalty' && (
                                <span className="relative inline-flex items-center shrink-0 mr-1" title="Gol Penalti">
                                  <i className="fa-regular fa-futbol text-amber-400 text-[10px]" />
                                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                    P
                                  </span>
                                </span>
                              )}
                              {e.type === 'assist' && (
                                <span className="text-amber-400 font-black text-[10px] leading-none shrink-0" title="Assist">
                                  A
                                </span>
                              )}
                              {e.type === 'yellow_card' && (
                                <span className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-300/40" title="Kartu Kuning" />
                              )}
                              {e.type === 'second_yellow' && (
                                <span className="relative inline-flex items-center shrink-0 align-middle ml-0.5" title="Kartu Kuning 2x (Kartu Merah)">
                                  <span className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                                  <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                </span>
                              )}
                              {e.type === 'red_card' && (
                                <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40" title="Kartu Merah" />
                              )}
                            </span>
                          ))}
                        </div>
                      </>
                    );

                    return isGuest ? (
                      <div key={item.id} className="flex items-center gap-2 py-2 px-1.5 rounded-xl text-slate-300 select-none">
                        {Content}
                      </div>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-800/40 px-1.5 rounded-xl transition-colors group"
                      >
                        {Content}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bench / Substitutes List - ONLY SHOW IF BENCH HAS PLAYERS */}
            {bench.length > 0 && (
              <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm sm:text-base font-black uppercase text-white">
                      Substitution
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {bench.length} Pemain
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {bench.map((item) => {
                    const chronEvts = getPlayerChronologicalEvents(item.player.id);
                    const subEvts = chronEvts.filter((e) => e.type === 'sub_in' || e.type === 'sub_out');
                    const matchEvts = chronEvts.filter((e) => e.type !== 'sub_in' && e.type !== 'sub_out');
                    const isGuest = item.player.isGuest;
                    const Content = (
                      <>
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                          <img
                            src={item.player.photoUrl || '/playertemplate.png'}
                            alt={item.player.name}
                            className="w-full h-full object-cover object-top scale-[1.35] origin-top opacity-80 group-hover:opacity-100"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-slate-400 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-300 group-hover:text-sky-300 transition-colors truncate flex items-center gap-1">
                          {item.player.name}
                          {isGuest && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Loan</span>}
                          {subEvts.map((sub) => (
                            <i
                              key={sub.id}
                              className={`fa-solid fa-right-left text-[9px] shrink-0 ${
                                sub.type === 'sub_in' ? 'text-emerald-400' : 'text-red-500'
                              }`}
                              title={sub.type === 'sub_in' ? 'Masuk sebagai Pengganti' : 'Digantikan'}
                            />
                          ))}
                        </span>

                        {/* Match Event Badges — Smaller Icons */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {matchEvts.map((e) => (
                            <span key={e.id} className="inline-flex items-center justify-center">
                              {e.type === 'goal' && <BallIcon size={11} />}
                              {e.type === 'own_goal' && <i className="fa-regular fa-futbol text-red-500 text-[10px] shrink-0" title="Gol Bunuh Diri" />}
                              {e.type === 'penalty' && (
                                <span className="relative inline-flex items-center shrink-0 mr-1" title="Gol Penalti">
                                  <i className="fa-regular fa-futbol text-amber-400 text-[10px]" />
                                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                    P
                                  </span>
                                </span>
                              )}
                              {e.type === 'assist' && (
                                <span className="text-amber-400 font-black text-[10px] leading-none shrink-0" title="Assist">
                                  A
                                </span>
                              )}
                              {e.type === 'yellow_card' && (
                                <span className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-300/40" title="Kartu Kuning" />
                              )}
                              {e.type === 'second_yellow' && (
                                <span className="relative inline-flex items-center shrink-0 align-middle ml-0.5" title="Kartu Kuning 2x (Kartu Merah)">
                                  <span className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                                  <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                </span>
                              )}
                              {e.type === 'red_card' && (
                                <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40" title="Kartu Merah" />
                              )}
                            </span>
                          ))}
                        </div>
                      </>
                    );

                    return isGuest ? (
                      <div key={item.id} className="flex items-center gap-2 py-2 px-1.5 rounded-xl text-slate-300 select-none">
                        {Content}
                      </div>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-800/40 px-1.5 rounded-xl transition-colors group"
                      >
                        {Content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
