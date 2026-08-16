'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

interface LineupPlayer {
  id: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
  x?: number | null;
  y?: number | null;
  player: {
    id: string;
    name: string;
    slug: string;
    number: number;
    position: string;
    photoUrl: string;
  };
}

interface TacticalPitchProps {
  lineups: LineupPlayer[];
  formation?: string;
  events?: Array<{
    id: string;
    playerId: string;
    type: string;
    assistPlayerId?: string;
  }>;
}

// Preset coordinates on pitch percentage (top %, left %)
const positionCoordinates: Record<string, { top: number; left: number }> = {
  GK: { top: 86, left: 50 },
  LB: { top: 68, left: 16 },
  CB1: { top: 72, left: 37 },
  CB2: { top: 72, left: 63 },
  RB: { top: 68, left: 84 },
  CM1: { top: 50, left: 32 },
  CM2: { top: 50, left: 68 },
  CAM: { top: 34, left: 50 },
  LW: { top: 16, left: 18 },
  ST: { top: 12, left: 50 },
  RW: { top: 16, left: 82 },

  // Alternatives / subs / 4-2-3-1
  CDM1: { top: 56, left: 36 },
  CDM2: { top: 56, left: 64 },
  LM: { top: 34, left: 18 },
  RM: { top: 34, left: 82 },
  CF: { top: 14, left: 50 },
};

export default function TacticalPitch({ lineups, formation = 'Belum Tersedia', events = [] }: TacticalPitchProps) {
  const getPosWeight = (pos: string, pitchPos?: string): number => {
    const p = (pos || '').toUpperCase();
    const pitchP = (pitchPos || '').toUpperCase();

    if (p === 'GK' || p === 'GOALKEEPER' || pitchP === 'GK') return 1;
    if (p === 'DF' || p === 'DEFENDER' || ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF'].includes(pitchP)) return 2;
    if (p === 'MF' || p === 'MIDFIELDER' || ['CM', 'CAM', 'CDM', 'LM', 'RM', 'MF'].includes(pitchP)) return 3;
    if (p === 'FW' || p === 'FORWARD' || ['ST', 'CF', 'LW', 'RW', 'FW'].includes(pitchP)) return 4;
    return 5;
  };

  const sortLineupsByPos = (list: LineupPlayer[]) => {
    return [...list].sort((a, b) => {
      const wA = getPosWeight(a.player?.position || a.positionName, a.pitchPosition);
      const wB = getPosWeight(b.player?.position || b.positionName, b.pitchPosition);
      if (wA !== wB) return wA - wB;
      return (a.player?.number || 0) - (b.player?.number || 0);
    });
  };

  const starters = sortLineupsByPos(lineups.filter((l) => l.isStarter));
  const bench = sortLineupsByPos(lineups.filter((l) => !l.isStarter));

  return (
    <div className="space-y-2">
      {/* Formation Badge Only (Compact top-right) */}
      <div className="flex items-center justify-end pb-1">
        <span className="text-[10px] sm:text-xs font-black font-mono px-3 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-400/30 shadow-sm">
          {formation || 'Belum Tersedia'}
        </span>
      </div>

      {/* Tactical Pitch (Tight Layout Filling Card) */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] max-w-4xl mx-auto">
        
        {/* Pitch Lines Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer Boundary */}
          <div className="absolute inset-1 sm:inset-2 border-2 border-white/25 rounded-lg"></div>
          
          {/* Halfway Line & Center Circle */}
          <div className="absolute top-1/2 left-1 right-1 sm:left-2 sm:right-2 h-0.5 bg-white/25 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-24 sm:w-32 h-24 sm:h-32 rounded-full border-2 border-white/25 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/35 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Penalty Area Top (Opponent side) */}
          <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 w-3/5 h-1/5 border-b-2 border-x-2 border-white/25 rounded-b-lg"></div>
          
          {/* Penalty Area Bottom (Our side) */}
          <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 w-3/5 h-1/5 border-t-2 border-x-2 border-white/25 rounded-t-lg"></div>
        </div>

        {/* Starter Markers on Pitch */}
        {starters.map((lineup) => {
          let coords = { top: 50, left: 50 };
          if (lineup.x != null && lineup.y != null) {
            coords = { top: lineup.y, left: lineup.x };
          } else {
            coords = positionCoordinates[lineup.pitchPosition] || { top: 50, left: 50 };
          }
          const rawEvts = events.filter((e) => e.playerId === lineup.player.id);
          const assistEvts = events.filter((e) => e.assistPlayerId === lineup.player.id && e.type !== 'sub');

          const playerSubEvts = events
            .filter((e) => e.type === 'sub' && (e.playerId === lineup.player.id || e.assistPlayerId === lineup.player.id))
            .map((e, idx) => ({
              id: `${e.id || idx}-${e.playerId === lineup.player.id ? 'in' : 'out'}`,
              isSubIn: e.playerId === lineup.player.id,
            }));

          // Deduplicate card events: 1st yellow + 2nd yellow red card
          const yellowEvts = rawEvts.filter((e) => e.type === 'yellow_card');
          const hasSecondYellowEvt = rawEvts.some((e) => e.type === 'second_yellow');

          const playerEvts: Array<{ type: string }> = [];
          rawEvts.forEach((e) => {
            if (['goal', 'own_goal', 'penalty', 'assist', 'red_card'].includes(e.type)) {
              playerEvts.push(e);
            }
          });
          assistEvts.forEach(() => {
            playerEvts.push({ type: 'assist' });
          });

          if (hasSecondYellowEvt || yellowEvts.length >= 2) {
            if (yellowEvts.length > 0) playerEvts.push({ type: 'yellow_card' });
            playerEvts.push({ type: 'second_yellow' });
          } else if (yellowEvts.length === 1) {
            playerEvts.push({ type: 'yellow_card' });
          }

          const isGuest = (lineup.player as any)?.isGuest;
          const TokenContent = (
            <>
              {/* Player Avatar Circle */}
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-sky-400 shadow-lg shadow-blue-500/40 bg-slate-900 group-hover:border-white">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={lineup.player.photoUrl || '/playertemplate.png'}
                    alt={lineup.player.name}
                    className="w-full h-full object-cover object-top scale-[1.35] origin-top rounded-full"
                  />
                </div>

                {/* Event Badges Overlay on Top-Right Corner */}
                {(playerEvts.length > 0 || playerSubEvts.length > 0) && (
                  <div className="absolute -top-2.5 -right-1 flex items-center gap-0.5 z-30 pointer-events-none bg-slate-950/80 backdrop-blur-xs px-1 py-0.5 rounded-full border border-white/20 shadow-md">
                    {playerSubEvts.map((sub) => (
                      <i
                        key={sub.id}
                        className={`fa-solid fa-right-left text-[7px] sm:text-[9px] shrink-0 ${
                          sub.isSubIn ? 'text-emerald-400' : 'text-red-500'
                        }`}
                        title={sub.isSubIn ? 'Masuk sebagai Pengganti' : 'Digantikan'}
                      />
                    ))}
                    {playerEvts.map((e, idx) => (
                      <span key={idx} className="inline-flex items-center justify-center">
                        {e.type === 'goal' && <i className="fa-regular fa-futbol text-amber-400 text-[8px] sm:text-[9.5px]" />}
                        {e.type === 'own_goal' && <i className="fa-regular fa-futbol text-red-500 text-[8px] sm:text-[9.5px]" />}
                        {e.type === 'penalty' && (
                          <span className="relative inline-flex items-center">
                            <i className="fa-regular fa-futbol text-amber-400 text-[8px] sm:text-[9.5px]" />
                            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-400 text-slate-950 font-black text-[5px] flex items-center justify-center leading-none">
                              P
                            </span>
                          </span>
                        )}
                        {e.type === 'assist' && (
                          <span className="text-amber-400 font-black text-[7.5px] sm:text-[9px] leading-none">A</span>
                        )}
                        {e.type === 'yellow_card' && (
                          <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-amber-400 rounded-[1px] inline-block border border-amber-300/40" />
                        )}
                        {e.type === 'second_yellow' && (
                          <span className="relative inline-flex items-center ml-0.5 shrink-0">
                            <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-amber-500 rounded-[1px] border border-amber-600/50" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                            <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-red-600 rounded-[1px] border border-red-400/40 absolute top-0 left-0" />
                          </span>
                        )}
                        {e.type === 'red_card' && (
                          <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-red-600 rounded-[1px] inline-block border border-red-400/40" />
                        )}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* Player Name Tag with squad number on the left in blue */}
              <div className="mt-0.5 z-10 glass-panel px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold text-white whitespace-nowrap group-hover:bg-blue-600 group-hover:text-white transition-colors border border-white/20 flex items-center gap-1 shadow-md">
                <span className="text-sky-400 font-black font-mono">
                  {lineup.player.number}
                </span>
                <span>
                  {lineup.player.name.split(' ')[0]}
                </span>
              </div>
            </>
          );

          return isGuest ? (
            <div
              key={lineup.id}
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center cursor-default select-none"
            >
              {TokenContent}
            </div>
          ) : (
            <Link
              key={lineup.id}
              href={`/players/${lineup.player.slug}`}
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-30"
            >
              {TokenContent}
            </Link>
          );
        })}
      </div>


    </div>
  );
}
