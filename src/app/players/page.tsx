import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Shield, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const positionOrder = ['GK', 'DF', 'MF', 'FW'];
const positionLabels: Record<string, string> = {
  GK: 'Penjaga Gawang (Goalkeepers)',
  DF: 'Lini Belakang (Defenders)',
  MF: 'Lini Tengah (Midfielders)',
  FW: 'Lini Depan (Forwards)',
};

export default async function PlayersPage() {
  let players: any[] = [];
  try {
    players = await prisma.player.findMany({
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
          Skuad Resmi Musim 2026/2027
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Mengenal pilar pertahanan, pengatur ritme serangan, dan mesin gol kebanggaan Mariners SC.
        </p>
      </div>

      {/* Grouped by Position */}
      {positionOrder.map((pos) => {
        const group = players.filter((p) => p.position === pos);
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
                  className="group glass-panel rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col justify-between"
                >
                  <div className="relative h-36 sm:h-64 overflow-hidden bg-slate-900">
                    <img
                      src={player.photoUrl || '/playertemplate.jpeg'}
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-transparent to-transparent" />
                    
                    {/* Number Badge */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl blue-gradient-bg text-white font-black text-xs sm:text-lg flex items-center justify-center shadow-lg border border-white/20">
                      #{player.number}
                    </div>

                    {player.isCaptain && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-1.5 sm:px-2 py-0.5 rounded bg-white text-blue-950 font-black text-[8px] sm:text-[10px] uppercase tracking-wider shadow">
                        KAPTEN
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-400 block truncate">
                      {player.nationality}
                    </span>
                    <h3 className="text-xs sm:text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase truncate">
                      {player.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-300 line-clamp-2">{player.bio}</p>
                    
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-xs font-semibold text-slate-300">
                      <span>{player.appearances} Laga</span>
                      <span className="text-sky-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Profil <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </span>
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
