'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TacticalPitch from '@/components/TacticalPitch';
import { useSystemSetting } from '@/context/SystemSettingContext';
import {
  Clock,
  Shield,
  Play,
} from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';

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

interface AttendanceItem {
  id: string;
  playerId: string;
  playerType: string;
  playerName?: string | null;
  status: string; // 'INVITED' | 'CONFIRMED' | 'DECLINED'
  declineReason?: string | null;
  player?: Player;
}

interface MatchTabsProps {
  match: {
    id: string;
    seasonName?: string;
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
    attendances?: AttendanceItem[];
  };
  h2hMatches?: Array<{
    id: string;
    opponentName: string;
    opponentLogo: string;
    matchDate: Date | string;
    competition: string;
    stage?: string | null;
    seasonName?: string;
    venue?: string | null;
    isHome: boolean;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  }>;
}

export default function MatchTabs({ match, h2hMatches = [] }: MatchTabsProps) {
  const { teamName, teamLogo, playerDefaultPhoto } = useSystemSetting();
  const defaultPlayerTemplate = playerDefaultPhoto || '/playertemplate.webp';
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup' | 'squad' | 'h2h'>('lineup');

  const hasH2H = Array.isArray(h2hMatches) && h2hMatches.length > 0;

  // Attendance local state (synced with parent & live updates)
  const [localAttendances, setLocalAttendances] = React.useState<AttendanceItem[]>(match.attendances || []);

  React.useEffect(() => {
    setLocalAttendances(match.attendances || []);
  }, [match.attendances]);

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.playerId && e.detail?.status) {
        setLocalAttendances((prev) => {
          const idx = prev.findIndex((a) => a.playerId === e.detail.playerId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], status: e.detail.status };
            return next;
          }
          return prev;
        });
      }
    };
    window.addEventListener('player_attendance_updated', handleUpdate);
    return () => window.removeEventListener('player_attendance_updated', handleUpdate);
  }, []);

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
  const hasLineup = starters.length > 0;

  const confirmedAttendances = localAttendances.filter(
    (a) => a.status === 'CONFIRMED' && Boolean(a.player)
  );
  const invitedAttendances = localAttendances.filter(
    (a) => a.status === 'INVITED' && Boolean(a.player)
  );

  const sortedConfirmedAttendances = [...confirmedAttendances].sort((a, b) => {
    const wA = getPosWeight(a.player?.position || '');
    const wB = getPosWeight(b.player?.position || '');
    if (wA !== wB) return wA - wB;
    return (a.player?.number || 0) - (b.player?.number || 0);
  });

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
    minute: e.minute,
    player: e.player,
    assistPlayer: e.assistPlayer,
  }));

  const dur = match.duration || 60;
  const htMinute = Math.floor(dur / 2);
  const ftMinute = dur;

  const startMs = new Date(match.matchDate).getTime();
  const nowMs = new Date().getTime();
  const elapsedMin = Math.floor((nowMs - startMs) / 60000);
  const isStarted = match.status === 'finished' || match.status === 'live' || (!isNaN(startMs) && nowMs >= startMs);

  // "ringkasan jangan muncul jika belum kickoff."
  // "list squad mana? itu tetap ada walaupun line up udah keluar, kecuali udah kickoff maka hilang"
  const hasKickedOff = isStarted;
  const showSummaryTab = hasLineup && hasKickedOff;
  const showLineupTab = hasLineup;
  const showSquadTab = !hasKickedOff;

  const searchParams = useSearchParams();
  const isInvite = Boolean(searchParams?.get('p') || searchParams?.get('player'));

  React.useEffect(() => {
    if (hasKickedOff) {
      if (showSummaryTab) {
        setActiveTab('summary');
      } else if (showLineupTab) {
        setActiveTab('lineup');
      }
    } else {
      if (isInvite) {
        setActiveTab('squad');
      } else if (showLineupTab) {
        setActiveTab('lineup');
      } else {
        setActiveTab('squad');
      }
    }
  }, [hasKickedOff, showSummaryTab, showLineupTab, isInvite]);

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
      {/* TAB NAVIGATION: SUMMARY & LINE UP / SQUAD LIST      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200">
        {showSummaryTab && (
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Ringkasan
          </button>
        )}

        {showLineupTab && (
          <button
            onClick={() => setActiveTab('lineup')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
              activeTab === 'lineup'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Line Up
          </button>
        )}

        {showSquadTab && (
          <button
            onClick={() => setActiveTab('squad')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
              activeTab === 'squad' || (!showLineupTab && !showSummaryTab && activeTab !== 'h2h')
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Squad List
          </button>
        )}

        {hasH2H && (
          <button
            onClick={() => setActiveTab('h2h')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
              activeTab === 'h2h'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            H2H
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB CONTENT: SUMMARY & TIMELINE                    */}
      {/* ═══════════════════════════════════════════════════ */}
      {showSummaryTab && activeTab === 'summary' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Timeline Section */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wide">
                Timeline Pertandingan
              </h3>
            </div>

            {displayTimelineEvents.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  {match.status === 'scheduled' ? 'Pertandingan belum dimulai.' : 'Belum ada event tercatat untuk pertandingan ini.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-7 border-l border-slate-200 space-y-4 max-w-3xl mx-auto">
                {displayTimelineEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Minute Badge */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                      {event.minute}'
                    </div>

                    <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-1 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                        <span className="uppercase text-slate-500 flex items-center gap-1.5">
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
                                <i className="fa-regular fa-futbol text-amber-500 text-xs" />
                                <span className="absolute -top-1.5 -right-2 w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black text-[7px] flex items-center justify-center leading-none shadow-xs">
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
                              <i className="fa-solid fa-right-left text-blue-600 shrink-0" /> Pergantian Pemain
                            </>
                          )}
                          {event.type === 'kickoff_1' && (
                            <span className="text-blue-600 flex items-center gap-1"><Play className="w-3 h-3 fill-blue-600" /> KICKOFF BABAK 1</span>
                          )}
                          {event.type === 'kickoff_2' && (
                            <span className="text-blue-600 flex items-center gap-1"><Play className="w-3 h-3 fill-blue-600" /> KICKOFF BABAK 2</span>
                          )}
                          {event.type === 'halftime' && (
                            <span className="text-blue-600 font-bold">HALF-TIME</span>
                          )}
                          {event.type === 'fulltime' && (
                            <span className="text-blue-600 font-bold">FULL-TIME</span>
                          )}
                        </span>
                      </div>

                      {event.isSystem || ['kickoff_1', 'kickoff_2', 'halftime', 'fulltime'].includes(event.type) ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {event.type === 'kickoff_1' && 'Kickoff Babak Pertama'}
                          {event.type === 'kickoff_2' && 'Kickoff Babak Kedua'}
                          {event.type === 'halftime' && 'Babak Pertama Berakhir'}
                          {event.type === 'fulltime' && 'Pertandingan Selesai'}
                        </div>
                      ) : event.type === 'sub' ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span className="text-emerald-600 font-bold">{event.player?.name}</span>
                          <i className="fa-solid fa-right-left text-blue-600 text-[10px]" />
                          {event.assistPlayer ? (
                            <span className="text-rose-600 font-bold">{event.assistPlayer.name}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {event.player?.name}
                        </div>
                      )}

                      {!event.isSystem && event.type !== 'sub' && event.assistPlayer && (
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 font-mono font-black text-[9px] inline-flex items-center justify-center">A</span>
                          <span>Assist:</span>
                          <span className="font-semibold text-slate-700">{event.assistPlayer.name}</span>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-[10px] sm:text-xs text-slate-500 italic pt-1 border-t border-slate-200 mt-1">
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
      {showLineupTab && activeTab === 'lineup' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Tactical Pitch 2D (Tanpa Box Putih Luar) */}
          <TacticalPitch
            lineups={match.lineups}
            formation={match.formation}
            events={pitchEvents}
            season={match.seasonName}
          />

          {/* Lineup Detail Grid (Starting XI + Substitutes) */}
          <div className={`grid grid-cols-1 ${bench.length > 0 ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-4 sm:gap-6`}>
            {/* Starting XI List */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase text-slate-900">
                    Starting
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {starters.length} Pemain
                </span>
              </div>

              {starters.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Belum ada Starting XI tercatat.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {starters.map((item) => {
                    const chronEvts = getPlayerChronologicalEvents(item.player.id);
                    const subEvts = chronEvts.filter((e) => e.type === 'sub_in' || e.type === 'sub_out');
                    const matchEvts = chronEvts.filter((e) => e.type !== 'sub_in' && e.type !== 'sub_out');
                    const isGuest = item.player.isGuest;
                    const Content = (
                      <>
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img
                            src={(item.player.photoUrl && item.player.photoUrl !== '/playertemplate.webp') ? item.player.photoUrl : defaultPlayerTemplate}
                            alt={item.player.name}
                            className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-blue-600 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1">
                          {item.player.name}
                          {isGuest && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 border border-amber-300">Loan</span>}
                          {subEvts.map((sub) => (
                            <i
                              key={sub.id}
                              className={`fa-solid fa-right-left text-[9px] shrink-0 ${
                                sub.type === 'sub_in' ? 'text-emerald-600' : 'text-red-500'
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
                                  <i className="fa-regular fa-futbol text-amber-500 text-[10px]" />
                                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                    P
                                  </span>
                                </span>
                              )}
                              {e.type === 'assist' && (
                                <span className="text-amber-600 font-black text-[10px] leading-none shrink-0" title="Assist">
                                  A
                                </span>
                              )}
                              {e.type === 'yellow_card' && (
                                <span className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-400" title="Kartu Kuning" />
                              )}
                              {e.type === 'second_yellow' && (
                                <span className="relative inline-flex items-center shrink-0 align-middle ml-0.5" title="Kartu Kuning 2x (Kartu Merah)">
                                  <span className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                                  <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                </span>
                              )}
                              {e.type === 'red_card' && (
                                <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-500" title="Kartu Merah" />
                              )}
                            </span>
                          ))}
                        </div>
                      </>
                    );

                    return isGuest ? (
                      <div key={item.id} className="flex items-center gap-2 py-2 px-1.5 rounded-xl text-slate-800 select-none">
                        {Content}
                      </div>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-50 px-1.5 rounded-xl transition-colors group"
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
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black uppercase text-slate-900">
                      Substitution
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {bench.length} Pemain
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {bench.map((item) => {
                    const chronEvts = getPlayerChronologicalEvents(item.player.id);
                    const subEvts = chronEvts.filter((e) => e.type === 'sub_in' || e.type === 'sub_out');
                    const matchEvts = chronEvts.filter((e) => e.type !== 'sub_in' && e.type !== 'sub_out');
                    const isGuest = item.player.isGuest;
                    const Content = (
                      <>
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img
                            src={(item.player.photoUrl && item.player.photoUrl !== '/playertemplate.webp') ? item.player.photoUrl : defaultPlayerTemplate}
                            alt={item.player.name}
                            className="w-full h-full object-cover object-top scale-[1.35] origin-top opacity-90 group-hover:opacity-100"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-slate-500 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1">
                          {item.player.name}
                          {isGuest && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 border border-amber-300">Loan</span>}
                          {subEvts.map((sub) => (
                            <i
                              key={sub.id}
                              className={`fa-solid fa-right-left text-[9px] shrink-0 ${
                                sub.type === 'sub_in' ? 'text-emerald-600' : 'text-red-500'
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
                                  <i className="fa-regular fa-futbol text-amber-500 text-[10px]" />
                                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                    P
                                  </span>
                                </span>
                              )}
                              {e.type === 'assist' && (
                                <span className="text-amber-600 font-black text-[10px] leading-none shrink-0" title="Assist">
                                  A
                                </span>
                              )}
                              {e.type === 'yellow_card' && (
                                <span className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-400" title="Kartu Kuning" />
                              )}
                              {e.type === 'second_yellow' && (
                                <span className="relative inline-flex items-center shrink-0 align-middle ml-0.5" title="Kartu Kuning 2x (Kartu Merah)">
                                  <span className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                                  <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                </span>
                              )}
                              {e.type === 'red_card' && (
                                <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-500" title="Kartu Merah" />
                              )}
                            </span>
                          ))}
                        </div>
                      </>
                    );

                    return isGuest ? (
                      <div key={item.id} className="flex items-center gap-2 py-2 px-1.5 rounded-xl text-slate-800 select-none">
                        {Content}
                      </div>
                    ) : (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-50 px-1.5 rounded-xl transition-colors group"
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

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB CONTENT: SQUAD LIST                             */}
      {/* ═══════════════════════════════════════════════════ */}
      {showSquadTab && (activeTab === 'squad' || (!showLineupTab && !showSummaryTab)) && (
        <div className="max-w-3xl mx-auto animate-fadeIn">
          {/* Squad List Box (Identik dengan Box Starting) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-black uppercase text-slate-900">
                  Squad List
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {sortedConfirmedAttendances.length} Pemain
              </span>
            </div>

            {sortedConfirmedAttendances.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada pemain yang mengonfirmasi kehadiran.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedConfirmedAttendances.map((item) => {
                  const p = item.player!;
                  const isGuest = p.isGuest;
                  const Content = (
                    <>
                      {/* Photo Avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={(p.photoUrl && p.photoUrl !== '/playertemplate.webp') ? p.photoUrl : defaultPlayerTemplate}
                          alt={p.name}
                          className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                        />
                      </div>

                      {/* Squad Number — Compact Aligned Column */}
                      <span className="w-5 text-center text-xs font-black text-blue-600 font-mono shrink-0">
                        {p.number}
                      </span>

                      {/* Player Name — Tight Left */}
                      <span className="flex-1 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1">
                        {p.name}
                        {isGuest && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 border border-amber-300">Loan</span>}
                      </span>

                      {/* Position */}
                      <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                        {p.position}
                      </span>
                    </>
                  );

                  return isGuest ? (
                    <div key={item.id} className="flex items-center gap-2 py-2 px-1.5 rounded-xl text-slate-800 select-none">
                      {Content}
                    </div>
                  ) : (
                    <Link
                      key={item.id}
                      href={`/players/${p.slug}`}
                      className="flex items-center gap-2 py-2 hover:bg-slate-50 px-1.5 rounded-xl transition-colors group"
                    >
                      {Content}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB CONTENT: HEAD-TO-HEAD (H2H)                    */}
      {/* ═══════════════════════════════════════════════════ */}
      {hasH2H && activeTab === 'h2h' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Box Rekor Pertemuan Langsung: Kotak Memanjang Menampilkan M M S K */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                Rekor Pertemuan
              </span>
              <h3 className="text-sm sm:text-base font-black uppercase text-slate-900">
                {(teamName || 'TEAM').toUpperCase()} vs {match.opponentName.toUpperCase()}
              </h3>
            </div>

            {/* Horizontal Form Badges M M S K */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              {h2hMatches.map((hMatch) => {
                const hasScore = hMatch.homeScore !== null && hMatch.awayScore !== null;
                const ourScore = hMatch.isHome ? (hMatch.homeScore ?? 0) : (hMatch.awayScore ?? 0);
                const oppScore = hMatch.isHome ? (hMatch.awayScore ?? 0) : (hMatch.homeScore ?? 0);
                const isWin = hasScore && ourScore > oppScore;
                const isLoss = hasScore && ourScore < oppScore;
                const char = !hasScore ? '-' : isWin ? 'M' : isLoss ? 'K' : 'S';
                const bg = !hasScore
                  ? 'bg-slate-200 text-slate-600'
                  : isWin
                  ? 'bg-emerald-600 text-white'
                  : isLoss
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white';

                return (
                  <span
                    key={hMatch.id}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${bg} font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0 select-none`}
                    title={`${formatWibDate(hMatch.matchDate)}: ${hMatch.homeScore ?? 0} - ${hMatch.awayScore ?? 0} (${char === 'M' ? 'Menang' : char === 'K' ? 'Kalah' : char === 'S' ? 'Seri' : 'Belum selesai'})`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* List of Previous Matches — IDENTIK 100% DENGAN RIWAYAT /MATCHES */}
          <div className="space-y-3">
            {h2hMatches.map((hMatch) => {
              const status = hMatch.status === 'finished' ? 'finished' : 'scheduled';
              const our = hMatch.isHome ? (hMatch.homeScore ?? 0) : (hMatch.awayScore ?? 0);
              const their = hMatch.isHome ? (hMatch.awayScore ?? 0) : (hMatch.homeScore ?? 0);
              const result = status === 'finished' && hMatch.homeScore !== null && hMatch.awayScore !== null
                ? (our > their ? 'WIN' : our < their ? 'LOSE' : 'DRAW')
                : null;
              const resultColor = result === 'WIN' ? '#16a34a' : result === 'LOSE' ? '#dc2626' : '#d97706';
              const resultBg = result === 'WIN' ? 'rgba(22,163,74,0.15)' : result === 'LOSE' ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)';
              const isFriendly = (hMatch.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY';
              const displayStage = hMatch.stage || (isFriendly ? 'Friendly Match' : hMatch.competition);

              return (
                <Link
                  key={hMatch.id}
                  href={`/matches/${hMatch.id}`}
                  className="block group bg-white p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  {/* Top Bar Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-4 mb-3 sm:mb-6">
                    {result ? (
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
                        {formatWibDate(hMatch.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {status === 'finished' && (
                        <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          FULL TIME
                        </span>
                      )}
                      {displayStage && (
                        <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          {displayStage}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Main Scoreboard Content */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-4 items-center text-center">
                    {/* Home Team (Nama di sisi luar, Logo mendekat ke tengah) */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-3 min-w-0">
                      <div className="text-right min-w-0 flex-1">
                        <h4 className="text-xs sm:text-base md:text-lg font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {(hMatch.isHome ? (teamName || 'TEAM') : hMatch.opponentName).toUpperCase()}
                        </h4>
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <img
                          src={hMatch.isHome ? (teamLogo || '/defaultteam.webp') : (hMatch.opponentLogo || '/defaultteam.webp')}
                          alt={hMatch.isHome ? (teamName || 'TEAM') : hMatch.opponentName}
                          className="w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Score / VS Badge (Sejajar dengan Logo & Nama) */}
                    <div className="flex flex-col items-center justify-center min-w-[76px] sm:min-w-[120px] px-1 py-0.5">
                      {status === 'finished' ? (
                        <>
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                            <span className="text-[9px] sm:text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                              FULL TIME
                            </span>
                          </div>
                          <div className="text-2xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest leading-none flex items-center justify-center my-0.5 sm:my-1">
                            {hMatch.homeScore ?? 0} : {hMatch.awayScore ?? 0}
                          </div>
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                            <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                              {hMatch.venue || '—'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                            <span className="text-[9px] sm:text-[11px] text-slate-600 font-bold">
                              {formatWibTime(hMatch.matchDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center my-0.5 sm:my-1">
                            <div className="inline-block px-3 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200 leading-none">
                              VS
                            </div>
                          </div>
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                            <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                              {hMatch.venue || '—'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Away Team (Logo mendekat ke tengah, Nama di sisi luar) */}
                    <div className="flex items-center justify-start gap-1.5 sm:gap-3 min-w-0">
                      <div className="shrink-0 flex items-center justify-center">
                        <img
                          src={!hMatch.isHome ? (teamLogo || '/defaultteam.webp') : (hMatch.opponentLogo || '/defaultteam.webp')}
                          alt={!hMatch.isHome ? (teamName || 'TEAM') : hMatch.opponentName}
                          className="w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="text-xs sm:text-base md:text-lg font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {(!hMatch.isHome ? (teamName || 'TEAM') : hMatch.opponentName).toUpperCase()}
                        </h4>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
