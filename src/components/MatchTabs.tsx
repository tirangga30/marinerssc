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
  ChevronRight,
} from 'lucide-react';

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

  // Helper to find events for a specific player in this match
  const getPlayerEvents = (playerId: string) => {
    return match.events.filter((e) => e.player.id === playerId);
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
          {/* Summary Text Box */}
          {match.summary && (
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-sky-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400">
                <Activity className="w-4 h-4 text-sky-400" />
                Ringkasan Laga
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed italic">
                "{match.summary}"
              </p>
            </div>
          )}

          {/* Timeline Section */}
          <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Clock className="w-5 h-5 text-sky-400" />
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Timeline Pertandingan
              </h3>
            </div>

            {match.events.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Shield className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  Belum ada event tercatat untuk pertandingan ini.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6 max-w-3xl mx-auto">
                {match.events.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Minute Badge */}
                    <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border-2 border-sky-400 text-sky-300 text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg">
                      {event.minute}'
                    </div>

                    <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-1.5 hover:border-sky-500/30 transition-colors">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="uppercase text-sky-300 flex items-center gap-1.5">
                          {event.type === 'goal' && '⚽ GOL!'}
                          {event.type === 'yellow_card' && '🟨 Kartu Kuning'}
                          {event.type === 'red_card' && '🟥 Kartu Merah'}
                          {event.type === 'sub' && '🔄 Pergantian Pemain'}
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-extrabold text-white">
                        {event.player.name}
                      </div>

                      {event.assistPlayer && (
                        <div className="text-xs text-sky-300 font-medium flex items-center gap-1">
                          <span>🎯 Assist:</span>
                          <span className="font-bold">{event.assistPlayer.name}</span>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-xs text-slate-300 italic pt-1 border-t border-slate-800/60 mt-1">
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
          <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-sky-400/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                  Taktik 2D &amp; Formasi
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-600/30 text-sky-300 text-xs font-bold border border-sky-400/30">
                Formasi: {match.formation}
              </span>
            </div>

            <TacticalPitch lineups={match.lineups} formation={match.formation} />
          </div>

          {/* Lineup Detail Grid (Starting XI + Substitutes) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
                                #{item.player.number}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                                {item.player.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-slate-400">
                              {item.positionName || item.pitchPosition}
                            </span>
                          </div>
                        </div>

                        {/* Match Event Badges if any */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {playerEvts.map((e) => (
                            <span key={e.id} className="text-xs">
                              {e.type === 'goal' && '⚽'}
                              {e.type === 'yellow_card' && '🟨'}
                              {e.type === 'red_card' && '🟥'}
                              {e.type === 'sub' && '🔄'}
                            </span>
                          ))}
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bench / Substitutes List */}
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

              {bench.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Belum ada pemain cadangan tercatat.
                </p>
              ) : (
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
                                #{item.player.number}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-sky-300 transition-colors truncate">
                                {item.player.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-slate-400">
                              {item.positionName || item.pitchPosition || item.player.position}
                            </span>
                          </div>
                        </div>

                        {/* Match Event Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {playerEvts.map((e) => (
                            <span key={e.id} className="text-xs">
                              {e.type === 'goal' && '⚽'}
                              {e.type === 'yellow_card' && '🟨'}
                              {e.type === 'red_card' && '🟥'}
                              {e.type === 'sub' && '🔄'}
                            </span>
                          ))}
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
