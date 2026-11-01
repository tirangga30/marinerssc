import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { ArrowLeft, BarChart2, Shield, Sparkles, Calendar, Ruler, Weight } from 'lucide-react';
import { Oswald } from 'next/font/google';
import PlayerMatchHistory from '@/components/player/PlayerMatchHistory';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* FontAwesome soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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

  let currentSeasonObj: any = null;
  let latestSeasonObj: any = null;
  let player: any = null;
  let allMatches: any[] = [];

  let member: any = null;
  let playerCardBg = '/bgprofil2.webp';
  let playerDefaultPhoto = '/playertemplate.webp';

  try {
    const systemSetting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    }).catch(() => null);
    if (systemSetting?.playerCardBg) {
      playerCardBg = systemSetting.playerCardBg;
    }
    if (systemSetting?.playerDefaultPhoto) {
      playerDefaultPhoto = systemSetting.playerDefaultPhoto;
    }

    currentSeasonObj = await prisma.season.findFirst({
      where: { isCurrent: true },
      select: { name: true },
    });
    latestSeasonObj = await prisma.season.findFirst({
      orderBy: { year: 'desc' },
      select: { name: true },
    });

    player = await prisma.player.findUnique({
      where: { slug },
      include: {
        member: true,
        events: {
          select: {
            id: true,
            matchId: true,
            type: true,
            minute: true,
            playerId: true,
            assistPlayerId: true,
          },
        },
        assistedEvents: {
          select: {
            id: true,
            matchId: true,
            type: true,
            minute: true,
            playerId: true,
            assistPlayerId: true,
          },
        },
      },
    });

    if (player) {
      allMatches = await prisma.footballMatch.findMany({
        select: {
          id: true,
          opponentName: true,
          opponentLogo: true,
          matchDate: true,
          competition: true,
          stage: true,
          seasonName: true,
          venue: true,
          isHome: true,
          homeScore: true,
          awayScore: true,
          status: true,
          duration: true,
          lineups: {
            where: { playerId: player.id },
            select: { id: true, isStarter: true, playerId: true },
          },
          attendances: {
            where: { playerId: player.id },
            select: { id: true, status: true, declineReason: true, playerId: true },
          },
          events: {
            select: {
              id: true,
              type: true,
              minute: true,
              playerId: true,
              assistPlayerId: true,
            },
          },
        },
        orderBy: { matchDate: 'desc' },
      });

      member = player.member || await prisma.member.findFirst({
        where: {
          OR: [
            { playerId: player.id },
            { fullName: player.name },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Database error in PlayerDetailPage:', error);
  }

  if (!player || player.isGuest) notFound();

  const primarySeason = currentSeasonObj?.name || latestSeasonObj?.name || '2027';
  const resolvedPlayer = resolvePlayerForSeason(player, primarySeason);

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

  const panelBg = { background: '#ffffff', border: '1px solid #e2e8f0' };
  const specBg = { background: '#f8fafc', border: '1px solid #e2e8f0' };

  // Biodata specs on Tim Utama page (Tanggal Lahir, Kewarganegaraan, Tinggi Badan, Berat Badan)
  const birthDateValue = player.birthDate
    ? new Date(player.birthDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const nationalityValue =
    player.nationality && player.nationality.trim() !== '' && player.nationality !== '-'
      ? player.nationality
      : 'Indonesia';

  const specs = [
    { label: 'Tanggal Lahir', value: birthDateValue },
    { label: 'Kewarganegaraan', value: nationalityValue },
    { label: 'Tinggi Badan', value: player.heightCm ? `${player.heightCm} cm` : '—' },
    { label: 'Berat Badan', value: player.weightKg ? `${player.weightKg} kg` : '—' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">

      {/* ═══════════════════════════════════════════════════ */}
      {/* MOBILE PROFILE HEADER (Edge-to-Edge Full Bleed)     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="block md:hidden -mx-3 -mt-6 bg-white border-b border-slate-200 overflow-hidden">
        {/* Top 4:3 Stadium Hero Box */}
        <div className="group relative w-full aspect-[4/3] overflow-hidden bg-slate-950 select-none">
          {/* Background Stadium Photo */}
          <img
            src={playerCardBg}
            alt="Stadium Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-transparent to-transparent opacity-85 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-[#060b14]/25 to-[#060b14]/75 pointer-events-none" />

          {/* Main Cut-out Player Photo:
              - Zoom in lebih dekat (posisi dada & kepala gagah, di-scale 1.18x)
              - Posisi 60% di daerah kanan (left-[60%] -translate-x-1/2)
              - Tanpa bayangan/ghost di latar
          */}
          <div className="absolute inset-x-0 top-0 bottom-[40px] overflow-hidden pointer-events-none z-10">
            <img
              src={(resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp') ? resolvedPlayer.photoUrl : playerDefaultPhoto}
              alt={resolvedPlayer.name}
              className="absolute bottom-0 left-[66%] -translate-x-1/2 translate-y-[20%] h-[96%] sm:h-[100%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] scale-[1.18] sm:scale-[1.22] origin-bottom"
            />
          </div>

          {/* Gradasi Hitam Biasa dari Bawah ke Atas untuk Latar Font */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/65 to-transparent pointer-events-none z-10" />

          {/* Member Tag if Member */}
          {member && (
            <div className="absolute top-3 right-3 z-30">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md border border-amber-300">
                <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                MEMBER
              </span>
            </div>
          )}

          {/* Nomor, Nama & Posisi Pemain di Pojok Bawah */}
          <div className="absolute left-3.5 sm:left-4 bottom-[58px] sm:bottom-[64px] z-20 flex items-center gap-3 sm:gap-3.5 max-w-[70%] sm:max-w-[65%]">
            {/* Nomor Punggung (Tanpa Cahaya / Solid) */}
            <span className="text-5xl sm:text-6xl font-black font-mono text-sky-400 leading-none shrink-0">
              {resolvedPlayer.number}
            </span>

            {/* Garis Pembatas Tipis */}
            <div className="w-[1.5px] h-10 sm:h-12 bg-white/40 shrink-0" />

            {/* Nama & Posisi: Nama lebih besar, Posisi lebih kecil */}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] truncate">
                {formatDisplayName(player.name)}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-sky-400 font-bold uppercase tracking-widest leading-none mt-1">
                {getPositionLabel(player.position)}
              </p>
            </div>
          </div>

          {/* Frosted Glass Floating Specs Bar */}
          <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl bg-[#091528]/85 backdrop-blur-md border border-white/15 px-2 py-2 shadow-2xl">
            <div className="grid grid-cols-4 gap-1 items-center">
              {/* Tanggal Lahir */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Tanggal Lahir
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {birthDateValue}
                  </p>
                </div>
              </div>

              {/* Kewarganegaraan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-2.5 rounded-xs overflow-hidden border border-white/20 flex flex-col shadow-xs shrink-0">
                    <div className="h-[5px] bg-[#e70011] w-full" />
                    <div className="h-[5px] bg-white w-full" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Kewarganegaraan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {nationalityValue}
                  </p>
                </div>
              </div>

              {/* Tinggi Badan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Ruler className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Tinggi Badan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {player.heightCm ? `${player.heightCm} cm` : '—'}
                  </p>
                </div>
              </div>

              {/* Berat Badan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Weight className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Berat Badan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {player.weightKg ? `${player.weightKg} kg` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Clean White Stats Bar */}
        <div className="py-3 px-2 sm:px-4 bg-white">
          <div className="grid grid-cols-5 divide-x divide-slate-100 text-center items-center">
            {[
              { label: 'MAIN', value: totalAppearances },
              { label: 'GOL', value: totalGoals },
              { label: 'ASSIST', value: totalAssists },
              { label: 'KUNING', value: totalYellowCards },
              { label: 'MERAH', value: totalRedCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-0.5 sm:px-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#0066cc] tracking-tight leading-none">
                  {s.value}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400 mt-1 leading-none">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DESKTOP PROFILE HEADER                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN: Player Photo Card (Aspect Ratio 4:5 with Stadium Backdrop) */}
        <div className="md:col-span-5 lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white flex flex-col">
          <div className="group relative aspect-[4/5] w-full overflow-hidden flex flex-col justify-end bg-slate-950">
            {/* Background Stadium Photo */}
            <img
              src={playerCardBg}
              alt="Stadium Background"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/50 to-transparent pointer-events-none" />

            {/* Ghost Action Shot */}
            <img
              src={(resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp') ? resolvedPlayer.photoUrl : playerDefaultPhoto}
              alt=""
              className="absolute right-[-10%] top-2 h-[95%] object-contain opacity-20 mix-blend-luminosity grayscale pointer-events-none"
            />

            {/* Full Cut-out Photo */}
            <img
              src={(resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp') ? resolvedPlayer.photoUrl : playerDefaultPhoto}
              alt={resolvedPlayer.name}
              className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] z-10"
            />

            {/* Gradasi Hitam Pekat di Bawah untuk Latar Nama Pemain (Desktop) */}
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none z-15" />

            {/* Top-Right Tag: "MEMBER" jika merupakan member */}
            {member && (
              <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md border border-amber-300">
                  <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                  MEMBER
                </span>
              </div>
            )}
            
            {/* Bottom Info: Extra Large Number alongside Name & Position */}
            <div className="relative z-20 p-5 sm:p-8 md:p-6 flex items-center gap-4 sm:gap-6 md:gap-5">
              <span className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {resolvedPlayer.number}
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
        </div>

        {/* RIGHT COLUMN (DESKTOP): Biodata & Akumulasi Musim Ini */}
        <div className="md:col-span-7 lg:col-span-7 space-y-4 md:space-y-6">
          {/* Physical Specs / Biodata Panel */}
          <div className="rounded-3xl p-6 border border-slate-200 shadow-sm bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">Biodata Pemain</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {item.label}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STATS PANEL (Single Combined Wide Box - Clean & Uniform) */}
          <div className="grid grid-cols-5 divide-x divide-slate-100 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden py-4 sm:py-5">
            {[
              { label: 'MAIN', value: totalAppearances },
              { label: 'GOL', value: totalGoals },
              { label: 'ASSIST', value: totalAssists },
              { label: 'KUNING', value: totalYellowCards },
              { label: 'MERAH', value: totalRedCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                <span className="text-2xl sm:text-4xl font-black font-mono text-blue-600 tracking-tight">
                  {s.value}
                </span>
                <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
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
