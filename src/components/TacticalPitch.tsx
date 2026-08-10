'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

interface LineupPlayer {
  id: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
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

export default function TacticalPitch({ lineups, formation = '4-3-3' }: TacticalPitchProps) {
  const starters = lineups.filter((l) => l.isStarter);
  const bench = lineups.filter((l) => !l.isStarter);

  return (
    <div className="space-y-6">
      {/* Tactical Pitch Box */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/3] max-w-3xl mx-auto rounded-2xl overflow-hidden border-2 border-sky-400/40 tactical-pitch-bg shadow-2xl shadow-blue-950/60">
        
        {/* Pitch Lines Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer Boundary */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-lg"></div>
          
          {/* Halfway Line & Center Circle */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/20 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-28 sm:w-32 h-28 sm:h-32 rounded-full border-2 border-white/20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Penalty Area Top (Opponent side) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/5 h-1/5 border-b-2 border-x-2 border-white/20 rounded-b-lg"></div>
          
          {/* Penalty Area Bottom (Our side) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-1/5 border-t-2 border-x-2 border-white/20 rounded-t-lg"></div>
          <div className="absolute bottom-[20%] left-1/2 w-2 h-2 bg-white/30 rounded-full -translate-x-1/2"></div>
        </div>

        {/* Formation Header Badge */}
        <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-lg border border-sky-400/40 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold tracking-wider text-sky-300 uppercase">
            Formasi: {formation}
          </span>
        </div>

        {/* Starter Markers on Pitch */}
        {starters.map((lineup) => {
          const coords = positionCoordinates[lineup.pitchPosition] || { top: 50, left: 50 };
          return (
            <Link
              key={lineup.id}
              href={`/players/${lineup.player.slug}`}
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-30"
            >
              {/* Player Avatar Circle */}
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-sky-400 shadow-lg shadow-blue-500/40 overflow-hidden bg-slate-900 group-hover:border-white">
                <img
                  src={lineup.player.photoUrl || '/playertemplate.jpeg'}
                  alt={lineup.player.name}
                  className="w-full h-full object-cover"
                />
                {/* Number Badge */}
                <div className="absolute bottom-0 right-0 blue-gradient-bg text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-white/30">
                  {lineup.player.number}
                </div>
              </div>

              {/* Player Name Tag */}
              <div className="mt-1 glass-panel px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold text-white whitespace-nowrap group-hover:bg-blue-600 group-hover:text-white transition-colors border border-white/20">
                {lineup.player.name.split(' ').pop()}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Substitutes / Bench Section */}
      {bench.length > 0 && (
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">
            Pemain Cadangan (Bench)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bench.map((b) => (
              <Link
                key={b.id}
                href={`/players/${b.player.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-400/40 shrink-0">
                  <img src={b.player.photoUrl || '/playertemplate.jpeg'} alt={b.player.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{b.player.name}</p>
                  <p className="text-[10px] text-sky-400/90 font-mono">#{b.player.number} • {b.player.position}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
