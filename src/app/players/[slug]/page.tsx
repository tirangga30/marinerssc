import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Shield, ArrowLeft, Award, Flame, UserCheck, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const player = await prisma.player.findUnique({
    where: { slug },
  });

  if (!player) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
  

      {/* Main Profile Card */}
      <div className="glass-panel rounded-3xl border border-amber-500/30 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-10">
          
          {/* Photo & Number Badge */}
          <div className="md:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-slate-900">
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
              
              {/* Giant Golden Jersey Number */}
              <div className="absolute bottom-4 right-4 text-6xl sm:text-7xl font-black font-mono gold-gradient-text opacity-90 drop-shadow-lg">
                #{player.number}
              </div>

              {player.isCaptain && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow">
                  KAPTEN TIM
                </div>
              )}
            </div>
          </div>

          {/* Details & Stats */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-extrabold uppercase border border-amber-500/30">
                  {player.position}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                  {player.nationality}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${player.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {player.status === 'Active' ? 'Aktif Siap Tampil' : 'Cedera'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 gold-gradient-text leading-tight">
                {player.name}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {player.bio}
              </p>
            </div>

            {/* Physical Specs */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tinggi Badan</span>
                <span className="text-sm font-extrabold text-slate-100">{player.heightCm ? `${player.heightCm} cm` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Berat Badan</span>
                <span className="text-sm font-extrabold text-slate-100">{player.weightKg ? `${player.weightKg} kg` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Lahir</span>
                <span className="text-sm font-extrabold text-slate-100">
                  {player.birthDate ? new Date(player.birthDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                </span>
              </div>
            </div>

            {/* Season Stats Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Statistik Musim 2026/2027
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-2xl font-black font-mono gold-gradient-text block">{player.goals}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Gol</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-2xl font-black font-mono text-slate-100 block">{player.assists}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assist</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-2xl font-black font-mono text-slate-100 block">{player.appearances}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Penampilan</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-2xl font-black font-mono text-amber-400 block">{player.yellowCards}🟨 {player.redCards}🟥</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Kartu</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
