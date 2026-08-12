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
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="inline-block shrink-0">
    <circle cx="50" cy="50" r="50" fill="#facc15" />
    <polygon points="50,30 66,42 60,62 40,62 34,42" fill="#111827" />
    <polygon points="50,4 59,18 50,30 41,18" fill="#111827" />
    <polygon points="78,16 82,34 66,42 61,26" fill="#111827" />
    <polygon points="84,66 72,82 60,72 60,62 74,56" fill="#111827" />
    <polygon points="16,66 26,82 40,72 40,62 28,56" fill="#111827" />
    <polygon points="22,16 39,26 34,42 18,34" fill="#111827" />
  </svg>
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

  // Helper to find events for a specific player in this match (Goal & Assist)
  const getPlayerEvents = (playerId: string) => {
    const evts: Array<{ id: string; type: 'goal' | 'assist' }> = [];
    match.events.forEach((e) => {
      if (e.player && e.player.id === playerId && e.type === 'goal') {
        evts.push({ id: `${e.id}-goal`, type: 'goal' });
      }
      if (e.assistPlayer && e.assistPlayer.id === playerId) {
        evts.push({ id: `${e.id}-assist`, type: 'assist' });
      }
    });
    return evts;
  };

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
                          {event.type === 'yellow_card' && '🟨 Kartu Kuning'}
                          {event.type === 'red_card' && '🟥 Kartu Merah'}
                          {event.type === 'sub' && '🔄 Pergantian Pemain'}
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
            <TacticalPitch lineups={match.lineups} formation={match.formation} />
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
                        className="flex items-center justify-between py-3 hover:bg-slate-800/40 px-2 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Photo Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-sky-400/40 shrink-0 bg-slate-900">
                            <img
                              src={item.player.photoUrl || '/playertemplate.jpeg'}
                              alt={item.player.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-sky-400 font-mono">
                                {item.player.number}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                                {item.player.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Match Event Badges (Only Goal & Assist) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {playerEvts
                            .filter((e) => e.type === 'goal' || e.type === 'assist')
                            .map((e) => (
                              <span key={e.id} className="inline-flex items-center justify-center">
                                {e.type === 'goal' && <BallIcon size={16} />}
                                {e.type === 'assist' && (
                                  <span className="w-4 h-4 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-400 font-mono font-black text-[10px] flex items-center justify-center shadow-sm">
                                    A
                                  </span>
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
                        className="flex items-center justify-between py-3 hover:bg-slate-800/40 px-2 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                            <img
                              src={item.player.photoUrl || '/playertemplate.jpeg'}
                              alt={item.player.name}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400 font-mono">
                                {item.player.number}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-sky-300 transition-colors truncate">
                                {item.player.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Match Event Badges (Only Goal & Assist) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {playerEvts
                            .filter((e) => e.type === 'goal' || e.type === 'assist')
                            .map((e) => (
                              <span key={e.id} className="inline-flex items-center justify-center">
                                {e.type === 'goal' && <BallIcon size={16} />}
                                {e.type === 'assist' && (
                                  <span className="w-4 h-4 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-400 font-mono font-black text-[10px] flex items-center justify-center shadow-sm">
                                    A
                                  </span>
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
