import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArrowLeft, BarChart2, Shield, Sparkles } from 'lucide-react';
import { Oswald } from 'next/font/google';
import PlayerMatchHistory from '@/components/player/PlayerMatchHistory';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* FontAwesome soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

export const dynamic = 'force-dynamic';

function getResult(match: {
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
}) {
  if (match.homeScore === null || match.awayScore === null) return null;
  const our = match.isHome ? match.homeScore : match.awayScore;
  const their = match.isHome ? match.awayScore : match.homeScore;
  if (our > their) return 'W';
  if (our < their) return 'L';
  return 'D';
}

function getPositionLabel(pos: string) {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'FORWARD';
}

function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;

  if (parts.length === 2) {
    if (fullName.length > 20) return parts[0];
    return fullName;
  }

  // 3 or more words: take first and middle name (first 2 words)
  const firstTwo = `${parts[0]} ${parts[1]}`;
  if (firstTwo.length > 18) {
    return parts[0];
  }
  return firstTwo;
}


export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [player, allMatches] = await Promise.all([
    prisma.player.findUnique({
      where: { slug },
      include: {
        member: true,
        lineups: {
          include: { match: { include: { events: true } } },
          orderBy: { match: { matchDate: 'desc' } },
        },
        events: {
          include: { match: true },
        },
        assistedEvents: {
          include: { match: true },
        },
      },
    }),
    prisma.footballMatch.findMany({
      include: {
        events: true,
        lineups: true,
      },
      orderBy: { matchDate: 'desc' },
    }),
  ]);

  if (!player || player.isGuest) notFound();

  // Check if player is a Member or matches a member record
  const member = player.member || await prisma.member.findFirst({
    where: {
      OR: [
        { playerId: player.id },
        { fullName: player.name },
      ],
    },
  });

  const nowMs = new Date().getTime();

  // All matches played by the club that have started or finished
  const activeMatches = (allMatches || []).filter((m: any) => {
    if (m.status === 'finished') return true;
    const hasFT = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
    if (hasFT) return true;
    const matchStartMs = new Date(m.matchDate).getTime();
    return !isNaN(matchStartMs) && nowMs >= matchStartMs;
  });

  // If player is a MEMBER (member yang ikut tim utama), only show matches where they were in the lineup!
  // If player is PEMAIN INTI (bukan member), show all team matches (with "Tidak masuk skuad" if not in lineup).
  const displayedMatches = member
    ? activeMatches.filter((m: any) => (m.lineups || []).some((l: any) => l.playerId === player.id))
    : activeMatches;

  // Dynamic accurate season statistics calculations across all logged events
  const calculatedGoals = (player.events || []).filter(
    (e: any) => e.type === 'goal' || e.type === 'penalty'
  ).length;
  const totalGoals = Math.max(player.goals || 0, calculatedGoals);

  const calculatedAssists =
    (player.events || []).filter((e: any) => e.type === 'assist').length +
    (player.assistedEvents || []).filter((e: any) => e.type !== 'sub').length;
  const totalAssists = Math.max(player.assists || 0, calculatedAssists);

  const calculatedAppearances = activeMatches.filter((m: any) => {
    const l = (m.lineups || []).find((line: any) => line.playerId === player.id);
    if (!l) return false;
    if (l.isStarter) return true;
    const matchEvents = m?.events || [];
    return matchEvents.some((e: any) => e.type === 'sub' && e.playerId === player.id);
  }).length;
  const totalAppearances = Math.max(player.appearances || 0, calculatedAppearances);

  const calculatedYellowCards = (player.events || []).filter(
    (e: any) => e.type === 'yellow_card'
  ).length;
  const totalYellowCards = Math.max(player.yellowCards || 0, calculatedYellowCards);

  const calculatedRedCards = (player.events || []).filter(
    (e: any) => e.type === 'red_card' || e.type === 'second_yellow'
  ).length;
  const totalRedCards = Math.max(player.redCards || 0, calculatedRedCards);

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };
  const specBg = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  // Biodata specs on Tim Utama page (Tanggal Lahir, Kewarganegaraan, Tinggi Badan, Berat Badan)
  const specs = member
    ? [
        { label: 'Tanggal Lahir', value: '—' },
        { label: 'Kewarganegaraan', value: '—' },
        { label: 'Tinggi Badan', value: '—' },
        { label: 'Berat Badan', value: '—' },
      ]
    : [
        {
          label: 'Tanggal Lahir',
          value: player.birthDate
            ? new Date(player.birthDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
        },
        {
          label: 'Kewarganegaraan',
          value:
            player.nationality && player.nationality !== 'Indonesia' && player.nationality !== '-'
              ? player.nationality
              : '—',
        },
        { label: 'Tinggi Badan', value: player.heightCm ? `${player.heightCm} cm` : '—' },
        { label: 'Berat Badan', value: player.weightKg ? `${player.weightKg} kg` : '—' },
      ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">

      {/* ═══════════════════════════════════════════════════ */}
      {/* PROFILE HEADER & STATS                             */}
      {/* MOBILE: Photo top with overlay, specs below (1 box)*/}
      {/* DESKTOP: Photo 4:5 left, Biodata + Stats right     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN: Player Photo Card (Aspect Ratio 4:5) */}
        <div className="md:col-span-5 lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden border border-sky-400/20 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] flex flex-col">
          {/* Top Photo Box (Aspect Ratio 4:5) */}
          <div className="group relative aspect-[4/5] w-full overflow-hidden flex flex-col justify-end">
            {/* Full Photo */}
            <img
              src={player.photoUrl || '/playertemplate.webp'}
              alt={player.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />

            {/* Top-Right Tag: "MEMBER" (tanpa jenis member) jika merupakan member */}
            {member && (
              <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-black/60 border border-amber-300">
                  <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                  MEMBER
                </span>
              </div>
            )}
            
            {/* Compact Black Gradient Overlay at Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14] via-[#060b14]/70 to-transparent pointer-events-none" />

            {/* Bottom Info: Extra Large Number alongside Name & Position */}
            <div className="relative z-10 p-5 sm:p-8 md:p-6 flex items-center gap-4 sm:gap-6 md:gap-5">
              <span className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {player.number}
              </span>
              <div className="min-w-0 space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-4xl md:text-3xl lg:text-4xl font-black text-white uppercase leading-tight drop-shadow-lg tracking-tight">
                  {formatDisplayName(player.name)}
                </h1>
                <p className="text-xs sm:text-base md:text-sm text-sky-400 font-extrabold uppercase tracking-widest leading-none drop-shadow">
                  {getPositionLabel(player.position)}
                </p>
              </div>
            </div>
          </div>

          {/* MOBILE ONLY: Physical Specs integrated in same box (seamless without border line) */}
          <div className="block md:hidden p-4 bg-gradient-to-b from-[#060b14] via-[#091222]/80 to-[#0a1526]">
            <div className="grid grid-cols-2 gap-2.5">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-3 bg-slate-900/80 border border-slate-800/80 shadow-inner">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {item.label}
                  </span>
                  <span className="text-xs font-extrabold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (DESKTOP): Biodata & Akumulasi Musim Ini */}
        <div className="md:col-span-7 lg:col-span-7 space-y-4 md:space-y-6">
          {/* DESKTOP ONLY: Physical Specs / Biodata Panel */}
          <div className="hidden md:block rounded-3xl p-6 border border-sky-400/20 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] space-y-4">
            <div className="flex items-center gap-2 border-b border-sky-400/20 pb-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">Biodata Pemain</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-4 bg-slate-900/80 border border-slate-800/80 shadow-inner">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {item.label}
                  </span>
                  <span className="text-base font-extrabold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STATS PANEL (Single Combined Wide Box - Clean & Uniform) */}
          <div className="grid grid-cols-5 divide-x divide-slate-800/80 bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] rounded-2xl sm:rounded-3xl border border-sky-400/20 shadow-2xl overflow-hidden py-4 sm:py-5">
            {[
              { label: 'GOL', value: totalGoals },
              { label: 'ASSIST', value: totalAssists },
              { label: 'MAIN', value: totalAppearances },
              { label: 'KUNING', value: totalYellowCards },
              { label: 'MERAH', value: totalRedCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LAST MATCHES                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <PlayerMatchHistory
        matches={displayedMatches}
        player={player}
      />

    </div>
  );
}
