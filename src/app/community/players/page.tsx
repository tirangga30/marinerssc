import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Sparkles, Users, ArrowRight, Shield, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

const positionOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const positionLabels: Record<string, string> = {
  GOALKEEPER: 'GOALKEEPER (KIPER)',
  DEFENDER: 'DEFENDER (BEK)',
  MIDFIELDER: 'MIDFIELDER (GELANDANG)',
  FORWARD: 'FORWARD (PENYERANG)',
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
  if (fullName.length <= 18) return fullName;
  if (parts.length >= 2) {
    const firstTwo = `${parts[0]} ${parts[1]}`;
    if (firstTwo.length <= 18) return firstTwo;
  }
  return parts[0];
}

export default async function CommunityPlayersPage() {
  let members: any[] = [];
  try {
    members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { jerseyNumber: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching community members:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 sm:space-y-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-amber-400/30 text-center space-y-3 bg-gradient-to-b from-[#15120a] via-[#090b14] to-[#060b14] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Soccer Community Roster</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Squad Member Komunitas
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Daftar seluruh member resmi Mariners SC Soccer Community musim 2026/2027.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white uppercase">Belum ada member aktif</h3>
          <p className="text-xs text-slate-400">Jadilah member pertama yang bergabung dalam Soccer Community!</p>
          <Link
            href="/community"
            className="inline-block px-5 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs mt-2"
          >
            Daftar Sekarang
          </Link>
        </div>
      ) : (
        /* Grouped by Position */
        positionOrder.map((pos) => {
          const group = members.filter((m) => normalizePos(m.position) === pos);
          if (group.length === 0) return null;

          return (
            <div key={pos} className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2.5 border-b border-amber-400/30 pb-2.5">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-wide">
                  {positionLabels[pos]}
                </h2>
                <span className="text-xs text-slate-400 font-bold">({group.length} Pemain)</span>
              </div>

              {/* 2 COLUMNS ON MOBILE, 3 ON TABLET, 4 ON DESKTOP */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {group.map((member) => (
                  <Link
                    key={member.id}
                    href={`/community/players/${member.id}`}
                    className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-amber-400/20 hover:border-amber-400/60 shadow-xl card-glow-hover flex flex-col justify-end"
                  >
                    {/* Full Photo */}
                    <img
                      src={member.photoUrl || '/playertemplate.png'}
                      alt={member.fullName}
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Tier Badge Top Left */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-extrabold uppercase text-[8px] sm:text-[9px] tracking-wider shadow">
                      {member.tier}
                    </div>

                    {/* Compact Black Gradient Overlay at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/60 to-transparent pointer-events-none" />

                    {/* Bottom Info: Number alongside Name & Position */}
                    <div className="relative z-10 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-amber-400 leading-none shrink-0 drop-shadow-md">
                        {member.jerseyNumber}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors uppercase leading-tight">
                          {formatBoxDisplayName(member.nickname || member.fullName)}
                        </h3>
                        <p className="text-[7px] sm:text-[8px] md:text-[9px] text-amber-400/90 font-bold uppercase tracking-widest leading-none">
                          {normalizePos(member.position)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}

    </div>
  );
}
