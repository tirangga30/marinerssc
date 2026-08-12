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
    lineups: LineupItem[];
    events: EventItem[];
  };
}

export default function MatchTabs({ match }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup'>('summary');

  const starters = match.lineups.filter((l) => l.isStarter);
  const bench = match.lineups.filter((l) => !l.isStarter);

  // Helper to find events for a specific player in this match (Goals, Cards, Assists, Subs)
  const getPlayerEvents = (playerId: string) => {
    const rawEvts: Array<{ id: string; type: string }> = [];
    match.events.forEach((e) => {
      if (e.player && e.player.id === playerId) {
        rawEvts.push({ id: `${e.id}-${e.type}`, type: e.type });
      }
      if (e.assistPlayer && e.assistPlayer.id === playerId) {
        rawEvts.push({ id: `${e.id}-assist`, type: 'assist' });
      }
    });

    const yellowEvts = rawEvts.filter((e) => e.type === 'yellow_card');
    const secondYellowEvt = rawEvts.find((e) => e.type === 'second_yellow');

    const result: Array<{ id: string; type: string }> = [];
    rawEvts.forEach((e) => {
      if (['goal', 'own_goal', 'penalty', 'assist', 'red_card'].includes(e.type)) {
        result.push(e);
      }
    });

    if (secondYellowEvt) {
      if (yellowEvts.length > 0) result.push(yellowEvts[0]);
      result.push(secondYellowEvt);
    } else if (yellowEvts.length >= 2) {
      result.push(yellowEvts[0]);
      result.push({ id: yellowEvts[1].id, type: 'second_yellow' });
    } else if (yellowEvts.length === 1) {
      result.push(yellowEvts[0]);
    }

    return result;
  };

  const pitchEvents = match.events.map((e) => ({
    id: e.id,
    playerId: e.player?.id || '',
    type: e.type,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* SLIDE TOGGLE BUTTONS                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex justify-center">
        <div className="glass-panel p-1.5 rounded-2xl border border-sky-400/20 inline-flex items-center gap-1 relative shadow-xl">
          {/* Animated Background Indicator */}
          <div
            className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-300 ease-out shadow-md shadow-blue-500/30 ${
              activeTab === 'summary'
                ? 'left-1.5 w-[calc(50%-6px)]'
                : 'left-[calc(50%+3px)] w-[calc(50%-6px)]'
            }`}
          />

          <button
            onClick={() => setActiveTab('summary')}
            className={`relative z-10 px-5 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-colors duration-200 ${
              activeTab === 'summary' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Summary &amp; Timeline
          </button>

          <button
            onClick={() => setActiveTab('lineup')}
            className={`relative z-10 px-5 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-colors duration-200 ${
              activeTab === 'lineup' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Line Up &amp; Formasi
          </button>
        </div>
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

            {match.events.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Shield className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  Belum ada event tercatat untuk pertandingan ini.
                </p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-7 border-l border-slate-800 space-y-4 max-w-3xl mx-auto">
                {match.events.map((event) => (
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
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-200">
                        {event.player.name}
                      </div>

                      {event.assistPlayer && (
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
        <div className="space-y-8 animate-fadeIn">
          {/* Tactical Pitch 2D */}
          <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-sky-400/20">
            <TacticalPitch lineups={match.lineups} formation={match.formation} events={pitchEvents} />
          </div>

          {/* Lineup Detail Grid (Starting XI + Substitutes) */}
          <div className={`grid grid-cols-1 ${bench.length > 0 ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-6 sm:gap-8`}>
            {/* Starting XI List */}
            <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm sm:text-base font-black uppercase text-white">
                    Starting XI (11 Pertama)
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
                    const playerEvts = getPlayerEvents(item.player.id);
                    return (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-800/40 px-1.5 rounded-xl transition-colors group"
                      >
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-400/40 shrink-0 bg-slate-900">
                          <img
                            src={item.player.photoUrl || '/playertemplate.jpeg'}
                            alt={item.player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-sky-400 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                          {item.player.name}
                        </span>

                        {/* Match Event Badges — Smaller Icons */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {playerEvts.map((e) => (
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
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bench / Substitutes List - ONLY SHOW IF BENCH HAS PLAYERS */}
            {bench.length > 0 && (
              <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm sm:text-base font-black uppercase text-white">
                      Pemain Cadangan (Bench)
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {bench.length} Pemain
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {bench.map((item) => {
                    const playerEvts = getPlayerEvents(item.player.id);
                    return (
                      <Link
                        key={item.id}
                        href={`/players/${item.player.slug}`}
                        className="flex items-center gap-2 py-2 hover:bg-slate-800/40 px-1.5 rounded-xl transition-colors group"
                      >
                        {/* Photo Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                          <img
                            src={item.player.photoUrl || '/playertemplate.jpeg'}
                            alt={item.player.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                          />
                        </div>

                        {/* Squad Number — Compact Aligned Column */}
                        <span className="w-5 text-center text-xs font-black text-slate-400 font-mono shrink-0">
                          {item.player.number}
                        </span>

                        {/* Player Name — Tight Left */}
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-300 group-hover:text-sky-300 transition-colors truncate">
                          {item.player.name}
                        </span>

                        {/* Match Event Badges — Smaller Icons */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {playerEvts.map((e) => (
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
