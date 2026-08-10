import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Users, Shield, ArrowRight } from 'lucide-react';

export const revalidate = 0;

const positionOrder = ['GK', 'DF', 'MF', 'FW'];
const positionLabels: Record<string, string> = {
  GK: 'Penjaga Gawang (Goalkeepers)',
  DF: 'Lini Belakang (Defenders)',
  MF: 'Lini Tengah (Midfielders)',
  FW: 'Lini Depan (Forwards)',
};

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { number: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-amber-500/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Tim Utama Mariners FC</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 gold-gradient-text">
          Skuad Resmi Musim 2025/2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Mengenal pilar pertahanan, pengatur ritme serangan, dan mesin gol kebanggaan Mariners FC.
        </p>
      </div>

      {/* Grouped by Position */}
      {positionOrder.map((pos) => {
        const group = players.filter((p) => p.position === pos);
        if (group.length === 0) return null;

        return (
          <div key={pos} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black uppercase text-slate-100 tracking-wide">
                {positionLabels[pos]}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {group.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="group glass-panel rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col justify-between"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-900">
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
                    
                    {/* Number Badge */}
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-xl gold-gradient-bg text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
                      #{player.number}
                    </div>

                    {player.isCaptain && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                        KAPTEN
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      {player.nationality}
                    </span>
                    <h3 className="text-base font-black text-slate-100 group-hover:text-amber-400 transition-colors uppercase truncate">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{player.bio}</p>
                    
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>{player.appearances} Laga</span>
                      <span className="text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Profil <ArrowRight className="w-3.5 h-3.5" />
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
