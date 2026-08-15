import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Shield, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const positionOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const positionLabels: Record<string, string> = {
  GOALKEEPER: 'GOALKEEPER',
  DEFENDER: 'DEFENDER',
  MIDFIELDER: 'MIDFIELDER',
  FORWARD: 'FORWARD',
};

const normalizePos = (pos: string) => {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'FORWARD';
};

function formatBoxDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;

  // If full name is short (<= 14 chars), display full name, otherwise first name only
  if (fullName.length <= 14) return fullName;
  return parts[0];
}

export default async function PlayersPage() {
  let players: any[] = [];
  try {
    players = await prisma.player.findMany({
      where: { isGuest: false },
      orderBy: { number: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl border border-sky-400/20 text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Tim Utama Mariners SC</span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white blue-gradient-text">
          Skuad Musim 2026/2027
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Mengenal pilar pertahanan, pengatur ritme serangan, dan mesin gol kebanggaan Mariners SC.
        </p>
      </div>

      {/* Grouped by Position */}
      {positionOrder.map((pos) => {
        const group = players.filter((p) => normalizePos(p.position) === pos);
        if (group.length === 0) return null;

        return (
          <div key={pos} className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2.5 border-b border-sky-400/30 pb-2.5">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-wide">
                {positionLabels[pos]}
              </h2>
            </div>

            {/* 2 COLUMNS ON MOBILE: grid-cols-2 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {group.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-400/60 shadow-xl card-glow-hover flex flex-col justify-end"
                >
                  {/* Full Photo */}
                  <img
                    src={player.photoUrl || '/playertemplate.png'}
                    alt={player.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Soft Black Gradient Overlay at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/60 to-transparent pointer-events-none" />

                  {/* Bottom Info: Number alongside Name & Position (Compact box font size) */}
                  <div className="relative z-10 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-md">
                      {player.number}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white group-hover:text-sky-300 transition-colors uppercase leading-tight">
                        {formatBoxDisplayName(player.name)}
                      </h3>
                      <p className="text-[7px] sm:text-[8px] md:text-[9px] text-sky-400/90 font-bold uppercase tracking-widest leading-none">
                        {normalizePos(player.position)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

    </div>
  );
}
