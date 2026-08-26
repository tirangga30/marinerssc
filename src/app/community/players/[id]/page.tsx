import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArrowLeft, BarChart2, Shield, Sparkles, Trophy, Calendar, MapPin, Award, Activity } from 'lucide-react';
import { Oswald } from 'next/font/google';
import { formatWibDate, formatWibTime } from '@/lib/date';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const dynamic = 'force-dynamic';

function formatPosition(pos: string) {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos || 'Midfielder';
}

export default async function CommunityPlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      matchAttendances: {
        where: { status: 'CONFIRMED' },
        include: {
          funMatch: {
            include: { events: true },
          },
          footballMatch: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      funMatchEvents: {
        include: { funMatch: true },
        orderBy: { minute: 'asc' },
      },
    },
  });

  if (!member) {
    notFound();
  }

  // Calculate dynamic stats
  const funMatchesPlayed = member.matchAttendances.filter((a) => a.funMatchId).length;
  const mainSquadMatchesPlayed = member.matchAttendances.filter((a) => a.matchId).length;
  const totalGoals = member.funMatchEvents.filter((e) => e.type === 'goal').length + member.goals;
  const totalAssists = member.funMatchEvents.filter((e) => e.type === 'assist').length + member.assists;
  const yellowCards = member.funMatchEvents.filter((e) => e.type === 'yellow_card').length;
  const redCards = member.funMatchEvents.filter((e) => e.type === 'red_card').length;

  const attendedFunMatches = member.matchAttendances
    .filter((a) => a.funMatch)
    .map((a) => a.funMatch!)
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-sky-300 transition-colors py-1 px-3 rounded-lg bg-slate-900/60 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Soccer Community
        </Link>
      </div>

      {/* Main Profile Header - 4:5 Card Hero */}
      <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-sky-400/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 items-center">
          
          {/* Photo Column - 4:5 Aspect Ratio */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/5] rounded-3xl overflow-hidden border-2 border-sky-400/40 shadow-2xl shadow-sky-950/80 bg-slate-950">
              <img
                src={member.photoUrl || '/playertemplate.png'}
                alt={member.fullName}
                className="w-full h-full object-cover object-top"
              />
              
              {/* Gradient Overlay bottom */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

              {/* Jersey Number Watermark Top Right */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-400 font-mono font-black text-xl sm:text-2xl shadow-lg">
                #{member.jerseyNumber}
              </div>

              {/* Tier Badge Top Left */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-sky-400/40 text-sky-300 font-extrabold uppercase text-[10px] tracking-widest flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>MEMBER {member.tier}</span>
              </div>

              {/* Name at bottom of photo on mobile */}
              <div className="absolute bottom-3 inset-x-3 text-center">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-600/40 text-sky-300 border border-sky-400/30">
                  {formatPosition(member.position)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Header info */}
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>SOCCER COMMUNITY MARINERS SC</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-white tracking-tight">
                {member.fullName}
              </h1>

              {member.nickname && (
                <p className="text-sm sm:text-base font-bold text-sky-400">
                  &ldquo;{member.nickname}&rdquo;
                </p>
              )}

              <p className="text-xs text-slate-400 max-w-lg leading-relaxed pt-1">
                Member resmi komunitas Mariners SC Soccer Community asal {member.origin}.
              </p>
            </div>

            {/* Quick Meta Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                Nomor: <strong className="text-amber-400 font-mono">#{member.jerseyNumber}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                Posisi: <strong className="text-sky-300">{formatPosition(member.position)}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                Paket: <strong className="text-amber-300">{member.tier}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                Status: <strong className="text-emerald-400">AKTIF</strong>
              </span>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Main</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">{funMatchesPlayed + member.funAppearances}</p>
                <span className="text-[9px] text-slate-500 font-semibold">Fun Match</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider">Gol</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-sky-300">{totalGoals}</p>
                <span className="text-[9px] text-slate-500 font-semibold">Total Gol</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Assist</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300">{totalAssists}</p>
                <span className="text-[9px] text-slate-500 font-semibold">Umpan Gol</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-rose-400 tracking-wider">Kartu</span>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                  <span className="text-amber-400">{yellowCards}</span> / <span className="text-rose-500">{redCards}</span>
                </p>
                <span className="text-[9px] text-slate-500 font-semibold">Kuning / Merah</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Match History Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-black uppercase text-white tracking-wide">
              Riwayat Pertandingan Fun Match
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {attendedFunMatches.length} Laga Tercatat
          </span>
        </div>

        {attendedFunMatches.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            Member ini belum memiliki riwayat pertandingan fun match yang selesai.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attendedFunMatches.map((fm) => {
              const myEventsInMatch = member.funMatchEvents.filter((e) => e.funMatchId === fm.id);
              const goalsInMatch = myEventsInMatch.filter((e) => e.type === 'goal').length;
              const assistsInMatch = myEventsInMatch.filter((e) => e.type === 'assist').length;

              return (
                <Link
                  key={fm.id}
                  href={`/community/matches/${fm.id}`}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 transition-all block group space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-900 pb-2">
                    <span>{formatWibDate(fm.matchDate)}</span>
                    <span className="text-sky-400 group-hover:underline">Lihat Detail ↗</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-extrabold text-xs text-sky-300 uppercase">{fm.teamAName}</span>
                    <span className="px-3 py-1 rounded-xl bg-slate-900 font-mono font-black text-sm text-white border border-slate-700">
                      {fm.teamAScore ?? 0} : {fm.teamBScore ?? 0}
                    </span>
                    <span className="font-extrabold text-xs text-amber-300 uppercase">{fm.teamBName}</span>
                  </div>

                  {(goalsInMatch > 0 || assistsInMatch > 0) && (
                    <div className="pt-2 border-t border-slate-900 flex items-center gap-3 text-[10px] text-slate-300">
                      {goalsInMatch > 0 && <span className="font-bold text-sky-300">⚽ {goalsInMatch} Gol</span>}
                      {assistsInMatch > 0 && <span className="font-bold text-amber-300">👟 {assistsInMatch} Assist</span>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
